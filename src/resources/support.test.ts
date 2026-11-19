import { SUPPORT, supportFor, WORLDWIDE } from './support';

describe('verified support resources', () => {
  const all = [...SUPPORT.flatMap((c) => c.resources), WORLDWIDE];

  it('every entry records an official https source and a verification date', () => {
    for (const r of all) {
      expect(r.source).toMatch(/^https:\/\//);
      expect(r.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.phone || r.url).toBeTruthy();
    }
  });

  it('phone numbers are digits only and have a display label', () => {
    for (const r of all.filter((x) => x.phone)) {
      // Short codes exist (France: 15 for SAMU).
      expect(r.phone).toMatch(/^\d{2,15}$/);
      expect(r.phoneLabel).toBeTruthy();
    }
  });

  it('every country has a name in each app language and no duplicates', () => {
    const codes = SUPPORT.map((c) => c.country);
    expect(new Set(codes).size).toBe(codes.length);
    for (const c of SUPPORT) expect(Object.values(c.names).every(Boolean)).toBe(true);
  });

  it('looks up by region code, case-insensitively', () => {
    expect(supportFor('fr')?.country).toBe('FR');
    expect(supportFor('TN')).toBeUndefined();
    expect(supportFor(undefined)).toBeUndefined();
  });
});
