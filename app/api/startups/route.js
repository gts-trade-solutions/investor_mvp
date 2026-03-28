// app/api/startups/route.js
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(req) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(req.url);

    const search  = (searchParams.get('search') || '').trim();
    const sectors = (searchParams.get('sectors') || '').split(',').map(s => s.trim()).filter(Boolean);
    const stages  = (searchParams.get('stages')  || '').split(',').map(s => s.trim()).filter(Boolean);
    const geos    = (searchParams.get('geos')    || '').split(',').map(s => s.trim()).filter(Boolean);

    // Base query
    let q = supabase
      .from('founders')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(60);

    // Keyword search across a few columns
    if (search) {
      // PostgREST OR syntax
      const like = (v) => `%${v.replace(/%/g, '').replace(/,/g, ' ')}%`;
      q = q.or(
        [
          `company_name.ilike.${like(search)}`,
          `industry.ilike.${like(search)}`,
          `country.ilike.${like(search)}`,
          `tagline.ilike.${like(search)}`
        ].join(',')
      );
    }

    // Filters
    if (stages.length) q = q.in('stage', stages);
    if (geos.length)   q = q.in('country', geos);
    if (sectors.length) {
      // founders has `industry` (text). Treat sector filters as case-insensitive matches on industry.
      const ors = sectors.map(s => `industry.ilike.%${s.replace(/%/g,'')}%`).join(',');
      q = q.or(ors);
    }

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Shape rows to what your StartupsDirectory expects
    const startups = (data || [])
      .filter(r => r.company_name) // only show filled companies
      .map(r => ({
        id: r.user_id,                                // or r.id if you have a PK
        name: r.company_name,
        org: { name: r.tagline || r.industry || '' }, // subtitle
        stage: r.stage || null,
        geo: r.country || null,
        mrr: null,                                    // founders table doesn't have MRR
        teamSize: r.team_size || null,
        sector: r.industry ? JSON.stringify([r.industry]) : '[]', // UI parses JSON string
        website: r.website || null,
      }));

    return NextResponse.json({ startups });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
