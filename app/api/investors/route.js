// app/api/investors/route.js
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(req) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(req.url);

    const search = (searchParams.get('search') || '').trim();
    const sectors = (searchParams.get('sectors') || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    const stages = (searchParams.get('stages') || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    const geos = (searchParams.get('geos') || '')
      .split(',').map(s => s.trim()).filter(Boolean);

    const checkSizeMin = Number(searchParams.get('checkSizeMin') ?? '');
    const checkSizeMax = Number(searchParams.get('checkSizeMax') ?? '');
    const hasMin = Number.isFinite(checkSizeMin);
    const hasMax = Number.isFinite(checkSizeMax);

    // --- Base query to investors (no join to keep it robust) ---
    let q = supabase
      .from('investors')
      .select('user_id, investor_type, check_min_usd, check_max_usd, sectors, geos, stages, notes, updated_at')
      .order('updated_at', { ascending: false })
      .limit(120);

    // Keyword search across investor columns
    if (search) {
      const like = `%${search.replace(/%/g, '').replace(/,/g, ' ')}%`;
      q = q.or(
        [
          `investor_type.ilike.${like}`,
          `sectors.ilike.${like}`,
          `stages.ilike.${like}`,
          `geos.ilike.${like}`,
          `notes.ilike.${like}`
        ].join(',')
      );
    }

    // Filters (case-insensitive contains on text columns)
    if (sectors.length) {
      const ors = sectors.map(s => `sectors.ilike.%${s.replace(/%/g,'')}%`).join(',');
      q = q.or(ors);
    }
    if (stages.length) {
      const ors = stages.map(s => `stages.ilike.%${s.replace(/%/g,'')}%`).join(',');
      q = q.or(ors);
    }
    if (geos.length) {
      const ors = geos.map(s => `geos.ilike.%${s.replace(/%/g,'')}%`).join(',');
      q = q.or(ors);
    }

    const { data: rows, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const userIds = (rows || []).map(r => r.user_id).filter(Boolean);
    let profileById = {};
    if (userIds.length) {
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, email, company')
        .in('id', userIds);
      if (!pErr && profiles) {
        for (const p of profiles) profileById[p.id] = p;
      }
    }

    // Helper to normalize list fields
    const toList = (v) => {
      if (!v) return [];
      try {
        const parsed = JSON.parse(v);
        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      } catch {}
      return String(v).split(',').map(s => s.trim()).filter(Boolean);
    };

    // Range overlap (do in JS for robustness)
    const overlap = (minA, maxA, minB, maxB) => {
      const aMin = Number.isFinite(minA) ? minA : 0;
      const aMax = Number.isFinite(maxA) ? maxA : Number.MAX_SAFE_INTEGER;
      const bMin = Number.isFinite(minB) ? minB : 0;
      const bMax = Number.isFinite(maxB) ? maxB : Number.MAX_SAFE_INTEGER;
      return aMax >= bMin && bMax >= aMin;
    };

    const filtered = rows.filter(r => {
      if (!hasMin && !hasMax) return true;
      return overlap(r.check_min_usd, r.check_max_usd, checkSizeMin, checkSizeMax);
    });

    const investors = filtered.map(r => {
      const prof = profileById[r.user_id] || {};
      const sectorsList = toList(r.sectors);
      const stagesList = toList(r.stages);
      return {
        id: r.user_id,
        name: prof.name || (prof.email ? prof.email.split('@')[0] : 'Anonymous Investor'),
        title: r.investor_type || null,
        org: { name: prof.company || null },             // if you store company on profile
        fund: {
          checkSizeMin: Number.isFinite(r.check_min_usd) ? r.check_min_usd : null,
          checkSizeMax: Number.isFinite(r.check_max_usd) ? r.check_max_usd : null,
        },
        sectors: JSON.stringify(sectorsList),             // your UI does JSON.parse(...)
        stages: JSON.stringify(stagesList),
        geos: r.geos || null,
        notes: r.notes || null,
      };
    });

    // Optional: post-search by profile name if a keyword was provided
    const final = search
      ? investors.filter(inv =>
          (inv.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (inv.org?.name || '').toLowerCase().includes(search.toLowerCase())
        )
      : investors;

    return NextResponse.json({ investors: final });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
