import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req) {
  const supabase = createServerSupabase();

  try {
    // 🧩 1. Auth check
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
    if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

    // 🧩 2. Parse form data
    const form = await req.formData();
    const get = (k) => (form.get(k) ?? '').toString().trim();
    const num = (v) => (v == null || v === '' ? null : Number(v));

    const row = {
      user_id: user.id,
      investor_type: get('investor_type') || null,
      check_min_usd: num(form.get('check_min_usd')),
      check_max_usd: num(form.get('check_max_usd')),
      sectors: get('sectors') || null,
      geos: get('geos') || null,
      stages: get('stages') || null,
      updated_at: new Date().toISOString(),
    };

    // 🧩 3. Insert or update investor record
    const { data: existing, error: selErr } = await supabase
      .from('investors')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (selErr) return NextResponse.json({ error: `Select failed: ${selErr.message}` }, { status: 400 });

    const dbRes = existing
      ? await supabase.from('investors').update(row).eq('user_id', user.id).select().single()
      : await supabase.from('investors').insert(row).select().single();

    if (dbRes.error) return NextResponse.json({ error: dbRes.error.message }, { status: 400 });

    // 🧩 4. Ensure profile exists (non-fatal upsert)
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
      role: (user.user_metadata?.role || 'INVESTOR').toUpperCase(),
    });

    // 🧩 5. Respond with success (frontend handles redirect)
    return NextResponse.json({ ok: true, next: '/investor' });

  } catch (e) {
    console.error('Investor onboarding error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
