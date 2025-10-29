import { NextResponse } from 'next/server';
import { createRouteSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function isSafeInternalPath(p) {
  return typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && !p.includes('://');
}

export async function GET(req) {
  const { supabase, res } = createRouteSupabase(req);
  const url = new URL(req.url);

  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = (url.searchParams.get('type') || '').toLowerCase();
  const next = url.searchParams.get('next');
  const providerError = url.searchParams.get('error_description') || url.searchParams.get('error');

  try {
    if (providerError) throw new Error(providerError);

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (token_hash) {
      const verifyType =
        type === 'recovery' || type === 'email_change' || type === 'magiclink' ? type : 'email';
      const { error } = await supabase.auth.verifyOtp({ type: verifyType, token_hash });
      if (error) throw error;
    } else {
      throw new Error('Missing verification parameters');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user after verification');

    // Default founders if role missing
    const role = String(user.user_metadata?.role ?? 'FOUNDER').toUpperCase();

    // Optional profile upsert (ignore errors)
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name ?? null,
      role,
    });

    const dest = isSafeInternalPath(next)
      ? next
      : role === 'INVESTOR'
      ? '/onboarding/investor'
      : '/onboarding/founder';

    // Use redirect while carrying over Set-Cookie headers
    return NextResponse.redirect(new URL(dest, req.url), { headers: res.headers });
  } catch (e) {
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(e?.message || 'Authentication failed')}`, req.url),
      { headers: res.headers }
    );
  }
}
