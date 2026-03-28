// /lib/supabaseServer.js
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export default function getSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Server actions only need to *read* cookies so RLS can see the session
        get(name) {
          return cookieStore.get(name)?.value;
        },
        // No-ops so we don't throw on edge / read-only responses
        set() {},
        remove() {},
      },
    }
  );
}
