import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }

  const form = await req.formData();
  const payload = {
    user_id: user.id,
    investor_type: form.get('investor_type') || null,
    check_min_usd: form.get('check_min_usd') ? Number(form.get('check_min_usd')) : null,
    check_max_usd: form.get('check_max_usd') ? Number(form.get('check_max_usd')) : null,
    sectors: form.get('sectors') || null,
    geos: form.get('geos') || null,
    stages: form.get('stages') || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('investors').upsert(payload, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, next: '/investor' }); // adjust final destination as needed
}
