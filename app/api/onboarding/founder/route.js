// app/api/onboarding/founder/route.js
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req) {
  const supabase = createServerSupabase();

  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) return NextResponse.json({ message: userErr.message }, { status: 401 });
    if (!user) return NextResponse.redirect(new URL('/auth/signin', req.url), 303);

    const form = await req.formData();
    const get = (k) => (form.get(k) ?? '').toString().trim();
    const num = (v) => (v == null || v === '' ? null : (Number.isFinite(+v) ? +v : null));

    const row = {
      user_id: user.id,
      company_name: get('company_name') || null,
      website: get('website') || null,
      industry: get('industry') || null,
      country: get('country') || null,
      stage: get('stage') || null,
      team_size: num(form.get('team_size')),
      capital_raised_usd: num(form.get('capital_raised_usd')),
      tagline: get('tagline') || null,
      problem_solution: get('problem_solution') || null,
      updated_at: new Date().toISOString(),
    };

    // check if row exists
    const { data: existing, error: selErr } = await supabase
      .from('founders')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (selErr) {
      const back = new URL('/onboarding/founder', req.url);
      back.searchParams.set('error', `Select failed: ${selErr.message}`);
      return NextResponse.redirect(back, 303);
    }

    // insert or update
    const dbRes = existing
      ? await supabase.from('founders').update(row).eq('user_id', user.id).select().single()
      : await supabase.from('founders').insert(row).select().single();

    if (dbRes.error) {
      const back = new URL('/onboarding/founder', req.url);
      back.searchParams.set('error', dbRes.error.message);
      return NextResponse.redirect(back, 303);
    }

    // ensure profile (non-fatal)
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
      role: (user.user_metadata?.role || 'FOUNDER').toUpperCase(),
    });

    // ✅ stay on the same page with a success flag
    const ok = new URL('/onboarding/founder', req.url);
    ok.searchParams.set('success', '1');
    // ✅ redirect to /investor on success
return NextResponse.redirect(new URL('/founder', req.url), 303);

  } catch (e) {
    return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 });
  }
}
