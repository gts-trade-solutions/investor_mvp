import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// For Server Components / RSC (read cookies, don't write)
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      // set/remove intentionally omitted in server components
    },
  });
}

// For Route Handlers (need to WRITE auth cookies)
export function createRouteSupabase(req) {
  // IMPORTANT: do NOT use NextResponse.next() in route handlers
  const res = new NextResponse(null, { status: 200 });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return req.cookies.get(name)?.value;
      },
      set(name, value, options) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name, options) {
        res.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });

  return { supabase, res };
}
