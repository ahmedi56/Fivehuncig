// Local test backend for the community, for development only (never shipped in the app).
//
// Runs the real migration in PGlite and answers the two Supabase endpoints the app uses:
//   POST /auth/v1/signup          anonymous sign-in → session for a new random user
//   POST /rest/v1/rpc/<function>  calls public.<function> as that user (role "authenticated")
// so the app's real Supabase client talks to the real SQL, without Docker or a cloud project.
//
//   node supabase/dev/local-server.mjs            (port 54321)
//   then set EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321 and any publishable key in .env.local
//
// Test helper (dev only): POST /dev/promote {"nickname": "..."} makes that member a moderator.
import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 54321);
const migration = readFileSync(new URL('../migrations/20261003000000_community.sql', import.meta.url), 'utf8');

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
`);
await db.exec(migration);

// Function signatures, so calls can use named arguments and return the right JSON shape.
const fns = new Map();
for (const row of (
  await db.query(`select p.proname, p.proretset, t.typname, p.proargnames, p.proargmodes
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace join pg_type t on t.oid = p.prorettype
    where n.nspname = 'public' and (p.proname like 'community\\_%' or p.proname like 'mod\\_%')`)
).rows) {
  const inputs = (row.proargnames ?? []).filter((_, i) => !row.proargmodes || row.proargmodes[i] === 'i');
  fns.set(row.proname, { set: row.proretset, type: row.typname, inputs });
}

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
/** Unsigned JWT-shaped token (the client only reads it; this server keeps the real mapping). */
const tokenFor = (sub) => `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ sub, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.dev`;
const sessions = new Map(); // access token → user id

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'apikey, authorization, content-type, x-client-info, x-supabase-api-version, prefer, accept-profile, content-profile',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};
const send = (res, status, body) => {
  res.writeHead(status, { ...CORS, 'content-type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
};
const readBody = (req) =>
  new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve(undefined);
      }
    });
  });

// One request at a time: PGlite is single-connection and the role/claim are session settings.
let queue = Promise.resolve();
const serial = (fn) => (queue = queue.then(fn, fn));

async function callAs(uid, name, args) {
  const fn = fns.get(name);
  const names = Object.keys(args).filter((k) => fn.inputs.includes(k));
  const params = names.map((k) => args[k]);
  const call = `public.${name}(${names.map((k, i) => `${k} => $${i + 1}`).join(', ')})`;
  const sql = fn.set ? `select * from ${call}` : `select ${call} as value`;
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  await db.exec(uid ? 'set role authenticated' : 'set role anon');
  try {
    const rows = (await db.query(sql, params)).rows;
    return fn.set ? rows : (rows[0]?.value ?? null);
  } finally {
    await db.exec('reset role');
  }
}

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  const url = new URL(req.url, 'http://localhost');
  const body = await readBody(req);
  if (body === undefined) return send(res, 400, { message: 'invalid json' });

  if (req.method === 'POST' && url.pathname === '/auth/v1/signup') {
    const id = randomUUID();
    await serial(() => db.query('insert into auth.users (id) values ($1)', [id]));
    const access_token = tokenFor(id);
    sessions.set(access_token, id);
    const user = { id, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
    return send(res, 200, {
      access_token,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: randomUUID(),
      user,
    });
  }

  if (req.method === 'POST' && url.pathname === '/dev/promote') {
    await serial(() => db.query(`update private.profiles set role = 'moderator' where nickname = $1`, [body.nickname]));
    return send(res, 200, { ok: true });
  }

  const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/([a-z_]+)$/);
  if (req.method === 'POST' && rpc) {
    if (!fns.has(rpc[1])) return send(res, 404, { code: 'PGRST202', message: 'function not found' });
    const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
    const uid = sessions.get(token);
    try {
      const data = await serial(() => callAs(uid, rpc[1], body));
      // Log only the call and outcome, like the real API logs: never message content.
      console.log(`rpc ${rpc[1]} ok`);
      return send(res, 200, data);
    } catch (e) {
      console.log(`rpc ${rpc[1]} error ${e.message}`);
      return send(res, e.code === '42501' ? 403 : 400, { code: e.code, message: e.message, details: null, hint: null });
    }
  }

  return send(res, 404, { message: 'not found' });
}).listen(PORT, () => console.log(`local community backend on http://localhost:${PORT}`));
