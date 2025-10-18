import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
if (!anon) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');

const supabase = createClient(url, anon);

export { supabase };
export default supabase;
