import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, currency = 'INR' } = body;

    if (!amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      );
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // rupees -> paise
      currency,
      receipt: `credits_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return NextResponse.json(
      { error: 'Unable to create order' },
      { status: 500 }
    );
  }
}
