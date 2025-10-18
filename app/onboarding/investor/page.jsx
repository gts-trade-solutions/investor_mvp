"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Briefcase, Wallet, CheckCircle2, ChevronRight } from "lucide-react";
import Header from "@/components/layout/header";

export default function InvestorOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const res = await fetch("/api/onboarding/investor", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.ok) {
      router.push(data.next); // ✅ redirect to /investor
    } else {
      alert(data.error || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <>
    <Header/>
    <div className="container-fluid">
      <main className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-background to-muted/30">
        <section className="px-4 py-8 md:py-12">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">Investor</span>
              <span>Onboarding</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">
              Tell us your preferences
            </h1>
            <p className="mt-1 text-muted-foreground">
              We’ll use these to match you with the right founders. You can edit this later.
            </p>
            <div className="mt-5 h-2 w-full rounded-full bg-muted">
              <div className="h-2 w-1/3 rounded-full bg-primary" />
            </div>
          </div>

          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="grid gap-0 md:grid-cols-12">
              {/* Sidebar */}
              <aside className="md:col-span-4 bg-muted/40 md:border-r">
                <div className="p-6 md:p-7">
                  <h2 className="text-lg font-semibold">What you’ll set</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These guide your dealflow feed.
                  </p>
                  <ul className="mt-4 space-y-3 text-sm">
                    {["Investor type", "Check size range", "Sectors of interest", "Geographies", "Stages"].map(
                      (text, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span className="text-foreground/90">{text}</span>
                        </li>
                      )
                    )}
                  </ul>
                  <div className="mt-6 rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                    Tip: list 3–6 sectors and a realistic check range for better matches.
                  </div>
                </div>
              </aside>

              {/* Form */}
              <div className="md:col-span-8">
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                  {/* Profile */}
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold">Profile</h3>
                      <p className="text-sm text-muted-foreground">Who you are as an investor.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="investor_type">Investor Type</Label>
                        <select
                          id="investor_type"
                          name="investor_type"
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          defaultValue="Angel"
                        >
                          <option>Angel</option>
                          <option>VC</option>
                          <option>Family Office</option>
                          <option>Corporate VC</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Check Size (USD)</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <Wallet className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="check_min_usd"
                              name="check_min_usd"
                              type="number"
                              min="0"
                              placeholder="Min e.g. 25000"
                              className="pl-9"
                            />
                          </div>
                          <div className="relative">
                            <Wallet className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="check_max_usd"
                              name="check_max_usd"
                              type="number"
                              min="0"
                              placeholder="Max e.g. 250000"
                              className="pl-9"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Leave blank if flexible.</p>
                      </div>
                    </div>
                  </section>

                  {/* Focus */}
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold">Focus</h3>
                      <p className="text-sm text-muted-foreground">Where you like to invest.</p>
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sectors">Sectors (comma separated)</Label>
                        <div className="relative">
                          <Briefcase className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="sectors" name="sectors" placeholder="Fintech, SaaS, Climate…" className="pl-9" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="geos">Geographies</Label>
                        <div className="relative">
                          <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input id="geos" name="geos" placeholder="US, Europe, India…" className="pl-9" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stages">Stages</Label>
                        <Input id="stages" name="stages" placeholder="Pre-seed, Seed, Series A…" />
                      </div>
                    </div>
                  </section>

                  {/* Footer */}
                  <div className="mt-2 flex items-center justify-between border-t pt-6">
                   
                    <Button type="submit" className="gap-2" disabled={loading}>
                      {loading ? "Saving..." : "Save & Continue"}
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
    </>
  );
}
