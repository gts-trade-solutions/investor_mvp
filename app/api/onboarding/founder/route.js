import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req) {
  const supabase = createServerSupabase();
  const url = new URL(req.url);

  // default fallback if not provided by form
  const defaultNext = url.searchParams.get('next') || '/founder';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin?error=not_authenticated', req.url));
  }

  const form = await req.formData();

  // allow either hidden field or query param to decide the destination
  const next = form.get('next') || defaultNext;

  const payload = {
    user_id: user.id,
    company_name: form.get('company_name') || null,
    website: form.get('website') || null,
    industry: form.get('industry') || null,
    country: form.get('country') || null,
    stage: form.get('stage') || null,
    team_size: form.get('team_size') ? Number(form.get('team_size')) : null,
    capital_raised_usd: form.get('capital_raised_usd') ? Number(form.get('capital_raised_usd')) : null,
    tagline: form.get('tagline') || null,
    problem_solution: form.get('problem_solution') || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('founders').upsert(payload, { onConflict: 'user_id' });

  // success → go to founder page; error → come back to onboarding with error
  const dest = error
    ? new URL('/founder', req.url)
    : new URL(next, req.url);

  if (error) dest.searchParams.set('error', error.message);
  else dest.searchParams.set('success', '1');

  return NextResponse.redirect(dest);
}
