import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  try {
    const body = await req.json();
    const { subject, message, deckUrl, investorIds } = body;

    if (!subject?.trim() || !message?.trim() || !Array.isArray(investorIds) || investorIds.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1) Create pitch
    const { data: pitch, error: pitchErr } = await supabaseAdmin
      .from('pitches')
      .insert({
        subject,
        message,
        deck_url: deckUrl || null,
      })
      .select('*')
      .single();
    if (pitchErr) throw pitchErr;

    // 2) Link recipients
    const recipients = investorIds.map(id => ({
      pitch_id: pitch.id,
      investor_id: id,
      status: 'sent',
    }));
    const { error: recErr } = await supabaseAdmin.from('pitch_recipients').insert(recipients);
    if (recErr) throw recErr;

    // 3) Find investor user_ids to notify
    // adjust column names if your table differs (e.g., org_name vs org->name JSON)
    const { data: investorUsers, error: invErr } = await supabaseAdmin
      .from('investors')
      .select('id, user_id, name, org_name')
      .in('id', investorIds);
    if (invErr) throw invErr;

    const notifRows = (investorUsers || [])
      .filter(inv => inv.user_id)
      .map(inv => ({
        recipient_user_id: inv.user_id,
        type: 'pitch_received',
        title: 'New pitch received',
        body: subject,
        data: {
          pitch_id: pitch.id,
          investor_id: inv.id,
          subject,
          excerpt: message.slice(0, 240),
          deck_url: deckUrl || null,
          url: `/investor/pitches/${pitch.id}` // optional deep link
        }
      }));

    if (notifRows.length) {
      const { error: notifErr } = await supabaseAdmin.from('notifications').insert(notifRows);
      if (notifErr) throw notifErr;
    }

    return NextResponse.json({ ok: true, pitchId: pitch.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
