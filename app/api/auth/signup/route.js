import { NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/supabase/server';

export async function POST(req) {
  const { supabase, res } = createRouteSupabase(req);

  const { name, email, password, role } = await req.json();
  if (!email || !password || !role) {
    return NextResponse.json({ message: 'Missing email, password or role' }, { status: 400 });
  }

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL;
  const normalized = String(role).toUpperCase();
  const onboarding = normalized === 'INVESTOR' ? '/onboarding/investor' : '/onboarding/founder';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: normalized, name },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(onboarding)}`,
    },
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  // If email confirmations OFF, session is returned -> cookies already set on `res`
  const payload = data?.session
    ? { ok: true, next: onboarding } // go straight to onboarding
    : { ok: true, next: `/auth/verify?email=${encodeURIComponent(email)}&role=${normalized}` };

  // Preserve Set-Cookie headers that Supabase wrote to `res`
  return new NextResponse(JSON.stringify(payload), {
    status: 200,
    headers: res.headers,
  });
}
