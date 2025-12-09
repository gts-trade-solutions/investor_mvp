'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MIN_CREDITS = 100;
const MAX_CREDITS = 10000;
const STEP = 100;

const BASE_RATE_USD = 0.1; // $0.10 per credit
const BASE_RATE_INR = 8;   // ₹ per credit – tweak to your real price

// Static plan config – prices are calculated dynamically
const PLAN_CONFIG = [
  {
    id: 'pro',
    title: 'Pro',
    credits: 3000,
    discount: 0.15, // 15% off
    bullets: ['All credits upfront', 'Use across features', 'No expiry'],
    buttonLabel: 'Choose Pro',
  },
  {
    id: 'premium',
    title: 'Premium',
    credits: 7200,
    discount: 0.25, // 25% off
    bullets: ['All Pro benefits', 'Best value at scale', 'Priority support'],
    buttonLabel: 'Choose Premium',
    highlight: true,
  },
];

export default function BillingPage() {
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [credits, setCredits] = useState(100);
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'INR'
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  const rate = currency === 'USD' ? BASE_RATE_USD : BASE_RATE_INR;
  const basePrice = credits * rate;

  const formatMoney = (amount) =>
    currency === 'USD'
      ? `$${amount.toFixed(2)}`
      : `₹${amount.toLocaleString('en-IN', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}`;

  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    setCredits(value);
    // when using slider, treat as scale/custom plan
    setSelectedPlan({
      id: 'scale',
      title: 'Scale',
      credits: value,
      finalPriceRaw: value * rate,
      priceFormatted: formatMoney(value * rate),
      currency,
    });
  };

  const handleIncrement = (direction) => {
    setCredits((prev) => {
      const next = direction === 'dec' ? prev - STEP : prev + STEP;
      const clamped = Math.min(Math.max(next, MIN_CREDITS), MAX_CREDITS);
      // update selected plan if we are on Scale
      if (selectedPlan?.id === 'scale') {
        setSelectedPlan({
          id: 'scale',
          title: 'Scale',
          credits: clamped,
          finalPriceRaw: clamped * rate,
          priceFormatted: formatMoney(clamped * rate),
          currency,
        });
      }
      return clamped;
    });
  };

  // compute dynamic pricing from config + rate
  const pricedPlans = PLAN_CONFIG.map((plan) => {
    const original = plan.credits * rate;
    const final = plan.discount ? original * (1 - plan.discount) : original;

    return {
      ...plan,
      originalPriceFormatted: formatMoney(original),
      finalPriceFormatted: formatMoney(final),
      finalPriceRaw: final,
      originalPriceRaw: original,
      saveLabel: plan.discount ? `Save ${Math.round(plan.discount * 100)}%` : undefined,
    };
  });

  const handlePlanSelect = (plan) => {
    setCredits(plan.credits);
    setSelectedPlan(plan);
  };

  // ➜ navigate to checkout page with query params
  const handleCheckout = () => {
    if (!selectedPlan) {
      alert('Please select a plan first.');
      return;
    }

    router.push(
      `/billing/checkout?plan=${encodeURIComponent(
        selectedPlan.id
      )}&credits=${encodeURIComponent(
        selectedPlan.credits
      )}&currency=${encodeURIComponent(selectedPlan.currency)}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-10">
        {/* Top heading */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Tailor the right credits
              <br className="hidden md:block" /> for you
            </h1>
          </div>
          <p className="max-w-md text-sm md:text-base text-slate-400">
            Scale up or down with on-demand credits—no subscriptions, no
            lock-ins.
          </p>
        </div>

        {/* Slider block */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm md:text-base">
              I need{' '}
              <span className="font-semibold text-emerald-400">
                {credits.toLocaleString('en-US')} credits
              </span>
            </p>

            {/* Currency toggle */}
            <div className="inline-flex items-center rounded-full bg-slate-900 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 text-xs rounded-full ${
                  currency === 'USD'
                    ? 'bg-emerald-500 text-slate-900 font-medium'
                    : 'text-slate-300'
                }`}
              >
                USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`px-3 py-1 text-xs rounded-full ${
                  currency === 'INR'
                    ? 'bg-emerald-500 text-slate-900 font-medium'
                    : 'text-slate-300'
                }`}
              >
                INR
              </button>
            </div>
          </div>

          {/* Slider & +/- buttons */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleIncrement('dec')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 hover:bg-slate-800"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="flex-1">
              <input
                type="range"
                min={MIN_CREDITS}
                max={MAX_CREDITS}
                step={STEP}
                value={credits}
                onChange={handleSliderChange}
                className="w-full accent-emerald-500"
              />
              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>{MIN_CREDITS.toLocaleString('en-US')}</span>
                <span>{(MAX_CREDITS * 0.2).toLocaleString('en-US')}</span>
                <span>{(MAX_CREDITS * 0.4).toLocaleString('en-US')}</span>
                <span>{(MAX_CREDITS * 0.6).toLocaleString('en-US')}</span>
                <span>{(MAX_CREDITS * 0.8).toLocaleString('en-US')}</span>
                <span>{MAX_CREDITS.toLocaleString('en-US')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleIncrement('inc')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {pricedPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              title={plan.title}
              credits={plan.credits}
              price={plan.finalPriceFormatted}
              originalPrice={plan.originalPriceFormatted}
              saveLabel={plan.saveLabel}
              bullets={plan.bullets}
              buttonLabel={plan.buttonLabel}
              isOutlineHighlighted={plan.highlight}
              onSelect={() =>
                handlePlanSelect({
                  id: plan.id,
                  title: plan.title,
                  credits: plan.credits,
                  finalPriceRaw: plan.finalPriceRaw,
                  priceFormatted: plan.finalPriceFormatted,
                  currency,
                })
              }
            />
          ))}

          {/* Scale plan driven by slider */}
          <PricingCard
            title="Scale"
            credits={credits}
            price={formatMoney(basePrice)}
            bullets={[
              'Pick any amount up to 10,000',
              'All credits upfront',
              'No expiry',
            ]}
            buttonLabel={`Buy ${credits.toLocaleString('en-US')} credits`}
            isOutlineHighlighted
            onSelect={() =>
              handlePlanSelect({
                id: 'scale',
                title: 'Scale',
                credits,
                finalPriceRaw: basePrice,
                priceFormatted: formatMoney(basePrice),
                currency,
              })
            }
          />
        </div>

        {/* Selected plan summary */}
        {selectedPlan && (
          <div className="mt-6 rounded-2xl border border-emerald-600/60 bg-emerald-500/5 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm text-emerald-300 font-medium">
                Selected plan: {selectedPlan.title}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {selectedPlan.credits.toLocaleString('en-US')} credits ·{' '}
                {selectedPlan.priceFormatted}
              </p>
            </div>
            <Button
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900"
              onClick={handleCheckout}
            >
              Confirm &amp; Pay
            </Button>
          </div>
        )}

        <p className="text-[11px] text-slate-500">
          Base rate {currency === 'USD' ? '$0.10' : `₹${BASE_RATE_INR}`}/credit.
          Pro and Premium include automatic volume discounts. Taxes may apply.
        </p>
      </div>
    </div>
  );
}

function PricingCard({
  title,
  credits,
  price,
  originalPrice,
  saveLabel,
  bullets,
  buttonLabel,
  isOutlineHighlighted,
  onSelect,
}) {
  return (
    <div
      className={`relative rounded-3xl border bg-slate-900/70 p-6 flex flex-col justify-between ${
        isOutlineHighlighted
          ? 'border-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.5)]'
          : 'border-slate-800'
      }`}
    >
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-2xl font-semibold">
          {credits.toLocaleString('en-US')} credits
        </p>

        <div className="space-y-1">
          <div className="text-2xl font-bold">{price}</div>
          {originalPrice && (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="line-through opacity-75">{originalPrice}</span>
              {saveLabel && (
                <span className="text-emerald-400 font-medium">
                  {saveLabel}
                </span>
              )}
            </div>
          )}
        </div>

        <ul className="mt-3 space-y-2 text-xs text-slate-300">
          {bullets.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className="mt-[2px] h-4 w-4 text-emerald-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <Button className="w-full" onClick={onSelect}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
