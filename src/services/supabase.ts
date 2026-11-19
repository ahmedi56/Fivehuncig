import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

/**
 * Supabase client for the community. Created only when the project is configured
 * (EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, see .env.example);
 * without them the community shows "not set up yet" and the rest of the app is unaffected.
 *
 * Both values are public by design. Everything a member can do is enforced by the database
 * functions in supabase/migrations, never by this client.
 */
let client: SupabaseClient | undefined;
let refreshWired = false;

export function supabaseConfigured(): boolean {
  return !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

/**
 * hCaptcha site key (public). Set it when CAPTCHA is on in Supabase (Authentication → Attack
 * Protection); the matching secret key lives only in the Supabase dashboard.
 */
export function captchaSiteKey(): string | undefined {
  return process.env.EXPO_PUBLIC_HCAPTCHA_SITE_KEY || undefined;
}

export function getSupabase(): SupabaseClient | undefined {
  if (client) return client;
  if (!supabaseConfigured()) return undefined;
  // Web static rendering runs without a window: there is no session to load there.
  if (Platform.OS === 'web' && typeof window === 'undefined') return undefined;
  client = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
  if (!refreshWired && Platform.OS !== 'web') {
    refreshWired = true;
    // Refresh tokens only while the app is in the foreground.
    AppState.addEventListener('change', (state) => {
      if (state === 'active') client?.auth.startAutoRefresh();
      else client?.auth.stopAutoRefresh();
    });
  }
  return client;
}
