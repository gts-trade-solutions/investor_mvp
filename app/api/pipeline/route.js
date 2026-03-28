import { NextResponse } from 'next/server';
import getSupabaseServerClient from '@/lib/supabaseServer';

export async function GET() {
  const sb = getSupabaseServerClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ rows: [] });

  const { data, error } = await sb
    .from('investor_pipeline')
    .select('id, stage, created_at, startup:startup_id ( id, name )')
    .eq('investor_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ rows: data });
}

export async function POST(req) {
  const { startup_id } = await req.json();
  const sb = getSupabaseServerClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { error } = await sb
    .from('investor_pipeline')
    .upsert({ investor_id: user.id, startup_id, stage: 'to_contact' }, { onConflict: 'investor_id,startup_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req) {
  const { id, stage } = await req.json();
  const sb = getSupabaseServerClient();
  const { error } = await sb.from('investor_pipeline').update({ stage }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const { id } = await req.json();
  const sb = getSupabaseServerClient();
  const { error } = await sb.from('investor_pipeline').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
