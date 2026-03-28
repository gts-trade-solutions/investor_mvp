'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';

const MIN_CREDITS = 100;
const MAX_CREDITS = 10000;
const STEP = 100;

const PRICE_PER_CREDIT_INR = 9;
const PRICE_PER_CREDIT_USD = 0.12;

const PLANS = [
  { id: 'pro', label: 'Pro · 3,000', credits: 3000 },
  { id: 'premium', label: 'Premium · 7,200', credits: 7200 },
  { id: 'custom', label: 'Custom amount', credits: null },
];

// this will be inlined by Next at build time
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

function CheckoutInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth?.() || { user: null };

  const planFromQuery = searchParams.get('plan') || 'custom';
  const creditsFromQuery = parseInt(searchParams.get('credits') || '100', 10);
  const currencyFromQuery = searchParams.get('currency') || 'INR';

  const initialCredits = Number.isNaN(creditsFromQuery)
    ? MIN_CREDITS
    : Math.min(Math.max(creditsFromQuery, MIN_CREDITS), MAX_CREDITS);

  const [selectedPlan, setSelectedPlan] = useState(planFromQuery);
  const [credits, setCredits] = useState(initialCredits);
  const [currency] = useState(currencyFromQuery);
  const [submitting, setSubmitting] = useState(false);

  const [billing, setBilling] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
    taxId: '',
  });

  // prefill email
  useEffect(() => {
    if (user?.email) {
      setBilling((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const pricePerCredit =
    currency === 'INR' ? PRICE_PER_CREDIT_INR : PRICE_PER_CREDIT_USD;

  const subtotal = credits * pricePerCredit;
  const estimatedTax = 0;
  const total = subtotal + estimatedTax;

  const formatMoney = (amount) =>
    currency === 'INR'
      ? `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
      : `$${amount.toFixed(2)}`;

  const handlePlanClick = (planId) => {
    setSelectedPlan(planId);
    const plan = PLANS.find((p) => p.id === planId);
    if (plan && plan.credits) {
      setCredits(plan.credits);
    }
  };

  const handleCreditsSlider = (e) => {
    const value = Number(e.target.value || MIN_CREDITS);
    const clamped = Math.min(Math.max(value, MIN_CREDITS), MAX_CREDITS);
    setSelectedPlan('custom');
    setCredits(clamped);
  };

  const handleCreditsInput = (e) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    const clamped = Math.min(Math.max(value, MIN_CREDITS), MAX_CREDITS);
    setSelectedPlan('custom');
    setCredits(clamped);
  };

  const handleBillingChange = (field) => (e) => {
    setBilling((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!billing.fullName.trim()) {
      alert('Please enter your full name.');
      return;
    }
    if (!billing.email.trim()) {
      alert('Please enter your billing email.');
      return;
    }
    if (
      !billing.address1.trim() ||
      !billing.city.trim() ||
      !billing.state.trim() ||
      !billing.zip.trim()
    ) {
      alert('Please complete the required address fields.');
      return;
    }

    if (!user) {
      alert('Please sign in to buy credits.');
      return;
    }

    try {
      setSubmitting(true);

      // 1️⃣ Create Razorpay order from backend using TOTAL amount
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total, // in rupees
          currency,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.id) {
        console.error('Error creating Razorpay order', orderData);
        alert(orderData.error || 'Failed to start payment');
        setSubmitting(false);
        return;
      }

      if (typeof window === 'undefined' || !window.Razorpay) {
        alert('Payment SDK not loaded. Please refresh the page.');
        setSubmitting(false);
        return;
      }

      // 2️⃣ Configure Razorpay Checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount, // paise
        currency: orderData.currency,
        
        name: 'Credit Top-up',
        description: `Purchase ${credits} credits`,
        order_id: orderData.id,
        prefill: {
          name: billing.fullName,
          email: billing.email,
          contact: billing.phone || undefined,
        },
        
        notes: {
          userId: user.id,
          planId: selectedPlan,
          credits: String(credits),
        },
        handler: async function (response) {
          // response has: razorpay_order_id, razorpay_payment_id, razorpay_signature
          try {
            // 3️⃣ Verify signature on backend
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.status !== 'ok') {
              alert('Payment verification failed. Please contact support.');
              setSubmitting(false);
              return;
            }

            // 4️⃣ If verification OK, call your credits API to actually add credits
            const creditRes = await fetch('/api/credits/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                credits,
                currency,
                planId: selectedPlan,
                billing,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
              }),
            });

            const creditJson = await creditRes.json();

            if (!creditRes.ok) {
              console.error('Credits checkout error', creditJson);
              alert(
                creditJson.error ||
                  'Payment succeeded but crediting failed. Please contact support.'
              );
              setSubmitting(false);
              return;
            }

            alert(
              `Payment successful!\n\nCredits: ${credits}\nTotal: ${formatMoney(
                total
              )}\nNew balance: ${creditJson.newBalance ?? 'updated'}`
            );
          } catch (err) {
            console.error(err);
            alert(
              'Payment captured, but something went wrong while finalizing your credits. Please contact support.'
            );
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          },
        },
        theme: {
          color: '#22c55e',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Something went wrong while starting the payment.');
      setSubmitting(false);
    }
  };

  const currentStep = 2; // Billing step

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8">
        {/* Stepper */}
        <div className="flex items-center gap-4 text-sm text-slate-400">
          {['Credits', 'Billing', 'Pay'].map((label, index) => {
            const step = index + 1;
            const isActive = step === currentStep;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {step}
                </div>
                <span className={isActive ? 'text-slate-100' : ''}>{label}</span>
                {step < 3 && (
                  <div className="mx-2 h-px w-10 bg-slate-700/60" aria-hidden />
                )}
              </div>
            );
          })}
        </div>

        <form
          className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
          onSubmit={handleSubmit}
        >
          {/* LEFT: credits + billing */}
          <div className="space-y-6">
            {/* Choose credits */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
              <h2 className="text-lg font-semibold">Choose credits</h2>

              {/* Plan buttons */}
              <div className="flex flex-wrap gap-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handlePlanClick(plan.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                      selectedPlan === plan.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                        : 'bg-slate-950/40 text-slate-200 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {plan.label}
                  </button>
                ))}
              </div>

              {/* Slider + input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Credits (100–10,000) <span className="text-red-500">*</span>
                  </span>
                </div>

                <input
                  type="range"
                  min={MIN_CREDITS}
                  max={MAX_CREDITS}
                  step={STEP}
                  value={credits}
                  onChange={handleCreditsSlider}
                  className="w-full accent-emerald-500"
                />

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2">
                    <input
                      type="number"
                      min={MIN_CREDITS}
                      max={MAX_CREDITS}
                      step={STEP}
                      value={credits}
                      onChange={handleCreditsInput}
                      className="w-24 bg-transparent text-sm outline-none"
                    />
                    <span className="text-xs text-slate-400">credits</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Billing details */}
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
              <h2 className="text-lg font-semibold">Billing details</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={billing.fullName}
                    onChange={handleBillingChange('fullName')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    Billing email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={billing.email}
                    onChange={handleBillingChange('email')}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={billing.phone}
                    onChange={handleBillingChange('phone')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    Company (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={billing.company}
                    onChange={handleBillingChange('company')}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">
                  Billing address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Address line 1"
                  className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={billing.address1}
                  onChange={handleBillingChange('address1')}
                />
                <input
                  type="text"
                  placeholder="Address line 2 (optional)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  value={billing.address2}
                  onChange={handleBillingChange('address2')}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={billing.city}
                    onChange={handleBillingChange('city')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    State / Province <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={billing.state}
                    onChange={handleBillingChange('state')}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    Zip / Postal code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="6-digit PIN"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={billing.zip}
                    onChange={handleBillingChange('zip')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    value={billing.country}
                    onChange={handleBillingChange('country')}
                  >
                    <option>India</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>South Africa</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="mt-1 text-xs text-emerald-400 hover:underline"
              >
                Add Tax ID (GSTIN)
              </button>
            </section>
          </div>

          {/* RIGHT: Order summary */}
          <aside className="space-y-4">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
              <h2 className="text-lg font-semibold">Order summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Credits</span>
                  <span className="font-medium">{credits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price per credit</span>
                  <span className="font-medium">
                    {formatMoney(pricePerCredit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="font-medium">
                    {formatMoney(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated tax</span>
                  <span className="font-medium">
                    {formatMoney(estimatedTax)}
                  </span>
                </div>

                <div className="my-2 h-px bg-slate-800" />

                <div className="flex justify-between text-sm font-semibold">
                  <span>Total (charged today)</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900"
                disabled={submitting}
              >
                {submitting ? 'Processing…' : 'Confirm & Pay'}
              </Button>

              <p className="mt-3 text-[11px] text-slate-500 text-center leading-relaxed">
                SSL Secure Payment · Razorpay · VISA · Mastercard · AmEx · RuPay · UPI
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 leading-relaxed">
              <p>
                Credits never expire. You&apos;ll see them in your wallet instantly
                after a successful payment.
              </p>
            </section>
          </aside>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center text-sm text-slate-400">
          Loading checkout…
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}
