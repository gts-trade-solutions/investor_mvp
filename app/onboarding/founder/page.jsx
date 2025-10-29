import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, MapPin, CheckCircle2, ChevronRight } from 'lucide-react';

// ensure this page is always dynamic (reads auth cookies)
export const dynamic = 'force-dynamic';

export default async function FounderOnboarding({ searchParams }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin');

  // ✅ Treat missing/unknown role as FOUNDER so founders never get bounced
  const role = String(user.user_metadata?.role ?? 'FOUNDER').toUpperCase();
  if (role === 'INVESTOR') redirect('/onboarding/investor');

  const { data: founder } = await supabase
    .from('founders')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const success = searchParams?.success === '1';
  const errorMsg = searchParams?.error || '';

  return (
    <div className="container-fluid">
      <main className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-background to-muted/30">
        <section className="px-4 py-8 md:py-12">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">Founder</span>
              <span>Onboarding</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">Tell us about your company</h1>
            <p className="mt-1 text-muted-foreground">This helps investors understand what you’re building. You can edit this later.</p>
            <div className="mt-5 h-2 w-full rounded-full bg-muted">
              <div className="h-2 w-1/3 rounded-full bg-primary" />
            </div>
          </div>

          {success && (
            <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">
              Saved successfully.
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
              {errorMsg}
            </div>
          )}

          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="grid gap-0 md:grid-cols-12">
              <aside className="md:col-span-4 bg-muted/40 md:border-r">
                <div className="p-6 md:p-7">
                  <h2 className="text-lg font-semibold">What you’ll need</h2>
                  <p className="mt-1 text-sm text-muted-foreground">A few basics so we can create your founder profile.</p>
                  <ul className="mt-4 space-y-3 text-sm">
                    {['Company name & website','Industry & stage','Team size','Capital raised (optional)','HQ country'].map((text, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-foreground/90">{text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                    Tip: concise, specific answers help you match with the right investors.
                  </div>
                </div>
              </aside>

              <div className="md:col-span-8">
                <form action="/api/onboarding/founder" method="POST" className="p-6 md:p-8 space-y-8">
                  {/* Company */}
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold">Company</h3>
                      <p className="text-sm text-muted-foreground">Your public profile information.</p>
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_name">Company Name <span className="text-destructive">*</span></Label>
                        <Input id="company_name" name="company_name" required placeholder="Acme Robotics"
                               defaultValue={founder?.company_name ?? ''} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <div className="relative">
                          <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="website" name="website" type="text" placeholder="https://acme.com" className="pl-9"
                                 defaultValue={founder?.website ?? ''} />
                        </div>
                        <p className="text-xs text-muted-foreground">Use your main marketing site if you have one.</p>
                      </div>
                    </div>
                  </section>

                  {/* Fundamentals */}
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold">Fundamentals</h3>
                      <p className="text-sm text-muted-foreground">High-level details about the business.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input id="industry" name="industry" placeholder="Fintech, Climate, AI, etc."
                               defaultValue={founder?.industry ?? ''} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">HQ Country</Label>
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="country" name="country" placeholder="India" className="pl-9"
                                 defaultValue={founder?.country ?? ''} />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="stage">Stage</Label>
                        <select id="stage" name="stage" className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                defaultValue={founder?.stage ?? 'Seed'}>
                          <option>Idea</option>
                          <option>Pre-seed</option>
                          <option>Seed</option>
                          <option>Project funding</option>
                          <option>Series A+</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="team_size">Employees</Label>
                        <Input id="team_size" name="team_size" type="number" min="1" placeholder="e.g. 8"
                               defaultValue={founder?.team_size ?? ''} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capital_raised_usd">Capital Required (USD)</Label>
                        <Input id="capital_raised_usd" name="capital_raised_usd" type="number" min="0" step="1" placeholder="e.g. 250000"
                               defaultValue={founder?.capital_raised_usd ?? ''} />
                        <p className="text-xs text-muted-foreground">Optional — leave blank if none.</p>
                      </div>
                    </div>
                  </section>

                  {/* Positioning */}
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold">Positioning</h3>
                      <p className="text-sm text-muted-foreground">Help investors grasp your value quickly.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagline">One-liner</Label>
                      <Input id="tagline" name="tagline" placeholder="Ex: Stripe for cross-border agriculture payments"
                             defaultValue={founder?.tagline ?? ''} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="problem_solution">Problem &amp; Solution</Label>
                      <textarea id="problem_solution" name="problem_solution" rows={5}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                placeholder="What problem do you solve? How is your solution different?"
                                defaultValue={founder?.problem_solution ?? ''} />
                    </div>
                  </section>

                  <div className="mt-2 flex items-center justify-between border-t pt-6">
                    <Button type="submit" className="gap-2">
                      Save &amp; Continue
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
