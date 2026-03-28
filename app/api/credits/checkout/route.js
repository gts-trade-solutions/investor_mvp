import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// MUST be server-side key (not anon)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MIN_CREDITS = 100;
const MAX_CREDITS = 10000;
const PRICE_PER_CREDIT_INR = 9;
const PRICE_PER_CREDIT_USD = 0.12;

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, credits, currency, planId, billing } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (
      !credits ||
      typeof credits !== 'number' ||
      credits < MIN_CREDITS ||
      credits > MAX_CREDITS
    ) {
      return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
    }

    if (!['INR', 'USD'].includes(currency)) {
      return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 });
    }

    const pricePerCredit =
      currency === 'INR' ? PRICE_PER_CREDIT_INR : PRICE_PER_CREDIT_USD;

    const amount = credits * pricePerCredit;

    // 1) Insert purchase row
    const { data: purchase, error: purchaseError } = await supabase
      .from('credit_purchases')
      .insert({
        user_id: userId,
        plan_id: planId || 'custom',
        credits,
        amount,
        currency,
        price_per_credit: pricePerCredit,
        billing_name: billing?.fullName || null,
        billing_email: billing?.email || null,
        billing_raw: billing || null,
        status: 'paid', // later: 'pending' until Razorpay confirms
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('purchaseError', purchaseError);
      return NextResponse.json(
        {
          error: purchaseError.message || 'Failed to create purchase',
          details: purchaseError.details,
          hint: purchaseError.hint,
        },
        { status: 500 }
      );
    }

    // 2) Increment credit balance
    const { error: creditsError } = await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_credits: credits,
    });

    if (creditsError) {
      console.error('creditsError', creditsError);
      return NextResponse.json(
        {
          error: creditsError.message || 'Failed to add credits',
          details: creditsError.details,
          hint: creditsError.hint,
        },
        { status: 500 }
      );
    }

    // 3) Fetch new balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credit_balance')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('profileError', profileError);
    }

    return NextResponse.json({
      ok: true,
      purchase,
      newBalance: profile?.credit_balance ?? null,
    });
  } catch (err) {
    console.error('checkout API error', err);
    return NextResponse.json(
      { error: 'Unexpected server error', details: String(err) },
      { status: 500 }
    );
  }
}
