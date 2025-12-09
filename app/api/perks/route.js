// app/api/perks/route.js
import { NextResponse } from 'next/server'
import getSupabaseServerClient from '@/lib/supabaseServer'

// GET /api/perks          -> all perks
// GET /api/perks?uid=...  -> a specific perk (or perks) by id
export async function GET(request) {
  const supabaseServer = getSupabaseServerClient()

  const { searchParams } = new URL(request.url)
  const uid = searchParams.get('uid')

  console.log('SUPABASE_URL from API:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('uid from query:', uid)

  let query = supabaseServer.from('perks').select('*')

  // if a uid is provided, filter by that column
  if (uid) {
    // if your column is named "id"
    query = query.eq('id', uid)

    // if you later add a "user_id" column instead, change to:
    // query = query.eq('user_id', uid)
  }

  const { data, error } = await query

  console.log('perks data from API:', data, 'error:', error)

  if (error) {
    console.error('Error fetching perks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load perks' },
      { status: 500 }
    )
  }

  return NextResponse.json(data ?? [], { status: 200 })
}
