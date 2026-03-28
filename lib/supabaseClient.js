// // /lib/supabaseClient.js
// import { createClient } from '@supabase/supabase-js';

// const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// if (!url)  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
// if (!anon) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');

// function createBrowserClient() {
//   return createClient(url, anon, {
//     auth: {
//       persistSession: true,       // keep session in localStorage
//       autoRefreshToken: true,     // refresh JWT automatically
//       detectSessionInUrl: true,   // handle OAuth/email link redirects
//     },
//   });
// }

// // Singleton to avoid multiple clients during HMR (prevents token mismatch)
// const g = typeof globalThis !== 'undefined' ? globalThis : window;
// export const supabase = g.__sb ?? createBrowserClient();
// if (process.env.NODE_ENV !== 'production') g.__sb = supabase;

// export default supabase;


// /lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url)  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
if (!anon) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');

function createBrowserClient() {
  return createClient(url, anon, {
    auth: {
      persistSession: true,       // keep session in localStorage
      autoRefreshToken: true,     // refresh JWT automatically
      detectSessionInUrl: true,   // handle OAuth/email link redirects
    },
  });
}

// Singleton to avoid multiple clients during HMR (prevents token mismatch)
const g = typeof globalThis !== 'undefined' ? globalThis : window;
export const supabase = g.__sb ?? createBrowserClient();
if (process.env.NODE_ENV !== 'production') g.__sb = supabase;

export default supabase;
