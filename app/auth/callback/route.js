import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(req) {
  const supabase = createServerSupabase();
  const url = new URL(req.url);
  const code = url.searchParams.get('code');              // PKCE/OAuth
  const token_hash = url.searchParams.get('token_hash');  // email confirm
  const type = url.searchParams.get('type');              // 'signup', etc.

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (token_hash && type === 'signup') {
      const { error } = await supabase.auth.verifyOtp({ type: 'email', token_hash });
      if (error) throw error;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user after verification');

    const role = (user.user_metadata?.role || 'FOUNDER').toUpperCase();
    // Optional: ensure a profile row exists
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
      role
    });

    const dest = role === 'INVESTOR' ? '/onboarding/investor' : '/onboarding/founder';
    return NextResponse.redirect(new URL(dest, req.url));
  } catch (e) {
    return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(e.message)}`, req.url));
  }
}
