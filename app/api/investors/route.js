// // app/api/investors/route.js
// import { NextResponse } from 'next/server';
// import getSupabaseServerClient from '@/lib/supabaseServer';

// const toArray = (v) =>
//   (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);

// const splitCSV = (text) => toArray(text); // your sectors/geos are TEXT (CSV-ish)

// export async function GET(req) {
//   const sb = getSupabaseServerClient();
//   const { searchParams } = new URL(req.url);

//   const search = searchParams.get('search') || '';
//   const sectorsFilter = toArray(searchParams.get('sectors'));
//   const stagesFilter  = toArray(searchParams.get('stages')); // you don't have stages col; we’ll ignore this
//   const geosFilter    = toArray(searchParams.get('geos'));
//   const checkSizeMin  = Number(searchParams.get('checkSizeMin') ?? 0);
//   const checkSizeMax  = Number(searchParams.get('checkSizeMax') ?? 1_000_000_000);

//   // 1) Fetch from your real columns
//   let query = sb
//     .from('investors')
//     .select('user_id, investor_type, check_min_usd, check_max_usd, sectors, geos')
//     .gte('check_max_usd', checkSizeMin)
//     .lte('check_min_usd', checkSizeMax);

//   // Simple filters against TEXT CSV columns
//   if (sectorsFilter.length) {
//     for (const s of sectorsFilter) query = query.ilike('sectors', `%${s}%`);
//   }
//   if (geosFilter.length) {
//     for (const g of geosFilter) query = query.ilike('geos', `%${g}%`);
//   }

//   // We'll handle "search" using the name from profiles later,
//   // but we can still check investor_type here
//   if (search) {
//     query = query.or(`investor_type.ilike.%${search}%`);
//   }

//   const { data: rows, error } = await query;
//   if (error) return NextResponse.json({ error: error.message }, { status: 400 });

//   // 2) Pull names from profiles (assumes profiles.id = auth.users.id)
//   const userIds = rows.map((r) => r.user_id).filter(Boolean);
//   let namesById = {};
//   if (userIds.length) {
//     const { data: profs, error: pErr } = await sb
//       .from('profiles')
//       .select('id, full_name')
//       .in('id', userIds);

//     if (pErr) {
//       // not fatal—just no names
//       namesById = {};
//     } else {
//       namesById = Object.fromEntries(
//         (profs || []).map((p) => [p.id, p.full_name || ''])
//       );
//     }
//   }

//   // 3) Map to UI shape
//   let investors = (rows || []).map((r) => ({
//     id: r.user_id, // your PK
//     name: namesById[r.user_id] || '—',
//     title: r.investor_type || '', // UI "title" from investor_type
//     org: { name: 'Independent' }, // you don’t have org_name; use default
//     fund: {
//       checkSizeMin: r.check_min_usd ?? null,
//       checkSizeMax: r.check_max_usd ?? null,
//     },
//     sectors: JSON.stringify(splitCSV(r.sectors)), // UI expects JSON string
//     stages: JSON.stringify([]), // you don’t have a stages column yet
//     notes: '', // optional: add a notes column later if you want
//   }));

//   // 4) If search was provided, also filter by profile full_name client-side
//   if (search) {
//     const s = search.toLowerCase();
//     investors = investors.filter((inv) =>
//       (inv.name || '').toLowerCase().includes(s) ||
//       (inv.title || '').toLowerCase().includes(s) ||
//       (inv.org?.name || '').toLowerCase().includes(s)
//     );
//   }

//   // Optional: sort by name
//   investors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

//   return NextResponse.json({ investors });
// }



// app/api/investors/route.js
import { NextResponse } from 'next/server';
import getSupabaseServerClient from '@/lib/supabaseServer';

const toArray = (v) =>
  v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : [];

const splitCSV = (text) => toArray(text); // sectors/geos are TEXT CSV-ish

export async function GET(req) {
  const supabase = getSupabaseServerClient();
  const { searchParams } = new URL(req.url);

  const search = searchParams.get('search') || '';
  const sectorsFilter = toArray(searchParams.get('sectors'));
  const stagesFilter = toArray(searchParams.get('stages')); // currently unused
  const geosFilter = toArray(searchParams.get('geos'));
  const checkSizeMin = Number(searchParams.get('checkSizeMin') ?? 0);
  const checkSizeMax = Number(
    searchParams.get('checkSizeMax') ?? 1_000_000_000
  );

  // 1) Base query from your real columns
  let query = supabase
    .from('investors')
    .select(
      `
        user_id,
        investor_type,
        check_min_usd,
        check_max_usd,
        sectors,
        geos
      `
    )
    .gte('check_max_usd', checkSizeMin)
    .lte('check_min_usd', checkSizeMax);

  // Filter on sectors (TEXT CSV)
  if (sectorsFilter.length) {
    for (const s of sectorsFilter) {
      query = query.ilike('sectors', `%${s}%`);
    }
  }

  // Filter on geos (TEXT CSV)
  if (geosFilter.length) {
    for (const g of geosFilter) {
      query = query.ilike('geos', `%${g}%`);
    }
  }

  // Simple search against investor_type;
  // name search will be done after we join profiles.
  if (search) {
    query = query.or(`investor_type.ilike.%${search}%`);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error('investors GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 2) Fetch profile names for these user_ids
  const userIds = rows.map((r) => r.user_id).filter(Boolean);
  let namesById = {};

  if (userIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (!profilesError && profiles?.length) {
      namesById = Object.fromEntries(
        profiles.map((p) => [p.id, p.full_name || ''])
      );
    }
  }

  // 3) Map to shape expected by the UI
  let investors = (rows || []).map((r) => ({
    id: r.user_id, // used as key in UI
    owner: r.user_id, // 👈 auth.users.id, used when sending pitch notification

    name: namesById[r.user_id] || '—',
    title: r.investor_type || '',
    org: { name: 'Independent' }, // no org_name column yet
    fund: {
      checkSizeMin: r.check_min_usd ?? null,
      checkSizeMax: r.check_max_usd ?? null,
    },
    sectors: JSON.stringify(splitCSV(r.sectors)),
    stages: JSON.stringify([]), // you don't have stages column yet
    notes: '', // placeholder; add notes col later if you want
  }));

  // 4) Extra search on profile name / org on the mapped objects
  if (search) {
    const s = search.toLowerCase();
    investors = investors.filter(
      (inv) =>
        (inv.name || '').toLowerCase().includes(s) ||
        (inv.title || '').toLowerCase().includes(s) ||
        (inv.org?.name || '').toLowerCase().includes(s)
    );
  }

  // Optional: sort alphabetically by name
  investors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  return NextResponse.json({ investors });
}
