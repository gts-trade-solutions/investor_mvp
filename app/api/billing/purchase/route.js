import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ service role key – keep it server only
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { planId, credits, amount, currency, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 1) Insert purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('credit_purchases')
      .insert({
        user_id: userId,
        plan_id: planId,
        credits,
        amount,
        currency,
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('purchaseError', purchaseError);
      return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
    }

    // 2) Increment credit balance
    const { error: creditsError } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_credits: credits,
    });

    if (creditsError) {
      console.error('creditsError', creditsError);
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
    }

    // later: here you can create a Razorpay / Stripe order instead of instantly adding credits

    return NextResponse.json({ ok: true, purchase });
  } catch (err) {
    console.error('billing purchase error', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
