// Supabase клиенті. Айнымалылар берілмесе, платформа бұрынғыдай браузердің localStorage-ін қолданады.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const SUPABASE_ENABLED = Boolean(url && key);

let client: SupabaseClient | null = null;

/** Тек браузерде шақырылады. Supabase бапталмаса — null. */
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_ENABLED || typeof window === "undefined") return null;
  if (!client) {
    client = createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "zhasyl-kz-auth" },
    });
  }
  return client;
}

/** Деректер қайда сақталатынын интерфейсте айту үшін */
export const STORAGE_WHERE = SUPABASE_ENABLED ? "ортақ дерекқорда" : "осы браузерде";
