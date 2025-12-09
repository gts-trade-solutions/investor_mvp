// app/investor/startup/[id]/page.jsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import supabase from '@/lib/supabaseClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Globe,
  Calendar,
  FileText,
  Heart,
  Star,
  MessageCircle,
} from 'lucide-react';
import {
  formatCurrency,
  formatSector,
  formatStage,
  formatDate,
} from '@/lib/utils';

export default function StartupProfileClient({ params }) {
  // 👇 this is the id from the URL /investor/startup/[id]
  const startupRouteId = params?.id;

  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);

  const [interested, setInterested] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  // Load startup data (mocked for now)
  useEffect(() => {
    if (!startupRouteId) {
      console.error('StartupProfileClient: missing params.id');
      setLoading(false);
      return;
    }

    // TODO: replace this with a real Supabase fetch using startupRouteId
    setStartup({
      id: startupRouteId, // 👈 IMPORTANT: this is what goes into investor_pipeline.startup_id
      name: 'AI Analytics Platform',
      tagline: 'Transforming business intelligence with AI-powered insights',
      description:
        'We help enterprises make data-driven decisions through our advanced AI analytics platform. Our solution processes millions of data points in real-time to provide actionable insights.',
      sector: ['FINTECH', 'ENTERPRISE'],
      stage: 'SEED',
      geo: 'US',
      website: 'https://aianalytics.com',
      founded: new Date('2022-01-15'),
      mrr: 50000,
      teamSize: 12,
      fundingRaised: 2_500_000,
      fundingGoal: 5_000_000,
      org: { name: 'TechStart Inc' },
      metrics: { revenue: 600000, growth: 25, customers: 45, retention: 92 },
      team: [
        {
          name: 'Jane Founder',
          role: 'CEO & Co-founder',
          bio: 'Former VP of Engineering at Google, 10+ years in AI/ML',
        },
        {
          name: 'John CTO',
          role: 'CTO & Co-founder',
          bio: 'Ex-Tesla Senior Engineer, PhD in Computer Science',
        },
      ],
      traction: [
        { metric: 'Monthly Revenue', value: '$6,000', change: '+25%' },
        { metric: 'Active Users', value: '1,200', change: '+40%' },
        { metric: 'Customer Retention', value: '92%', change: '+5%' },
        { metric: 'NPS Score', value: '68', change: '+12%' },
      ],
      updates: [
        {
          id: '1',
          title: 'Closed 3 Enterprise Deals',
          date: new Date('2024-01-15'),
          content:
            'Excited to announce partnerships with Fortune 500 companies...',
        },
        {
          id: '2',
          title: 'Product Launch Success',
          date: new Date('2024-01-10'),
          content:
            'Our new dashboard has been well received by early customers...',
        },
      ],
    });
    setLoading(false);
  }, [startupRouteId]);

  // Load persisted interested/saved status
  useEffect(() => {
    if (!startup?.id) return;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // interest
      const { data: pip } = await supabase
        .from('investor_pipeline')
        .select('startup_id')
        .eq('investor_id', user.id)
        .eq('startup_id', startup.id)
        .limit(1)
        .maybeSingle();
      setInterested(!!pip);

      // save
      const { data: sv } = await supabase
        .from('investor_saves')
        .select('startup_id')
        .eq('investor_id', user.id)
        .eq('startup_id', startup.id)
        .limit(1)
        .maybeSingle();
      setSaved(!!sv);
    })();
  }, [startup?.id]);

  async function onExpressInterest() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth/signin';
        return;
      }

      if (!startup?.id) {
        console.error('Cannot express interest: startup.id is missing', startup);
        alert('Something went wrong (no startup id). Please refresh the page.');
        return;
      }

      const { error } = await supabase.from('investor_pipeline').upsert(
        {
          investor_id: user.id,
          startup_id: startup.id,  // 👈 will now be params.id, not null
          stage: 'to_contact',     // 👈 matches your CHECK constraint
        },
        { onConflict: 'investor_id,startup_id' }
      );

      if (error) throw error;
      setInterested(true);
    } catch (e) {
      alert(e?.message || 'Failed to express interest');
    }
  }

  async function onToggleSave() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth/signin';
        return;
      }

      if (!startup?.id) {
        console.error('Cannot toggle save: startup.id is missing', startup);
        alert('Something went wrong (no startup id). Please refresh the page.');
        return;
      }

      if (!saved) {
        const { error } = await supabase
          .from('investor_saves')
          .upsert(
            { investor_id: user.id, startup_id: startup.id },
            { onConflict: 'investor_id,startup_id' }
          );
        if (error) throw error;
        setSaved(true);
      } else {
        const { error } = await supabase
          .from('investor_saves')
          .delete()
          .eq('investor_id', user.id)
          .eq('startup_id', startup.id);
        if (error) throw error;
        setSaved(false);
      }
    } catch (e) {
      alert(e?.message || 'Failed to toggle save');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold">Startup Profile</h1>
        <p className="text-muted-foreground">Loading startup details...</p>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold">Startup Not Found</h1>
        <p className="text-muted-foreground">
          The startup you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  const progressPct = Math.min(
    100,
    Math.round((startup.fundingRaised / (startup.fundingGoal || 1)) * 100)
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold leading-tight truncate">
            {startup.name}
          </h1>
          <p className="mt-2 text-muted-foreground">{startup.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/70">
            <Badge variant="outline">{formatStage(startup.stage)}</Badge>
            <span className="text-white/40">•</span>
            <span className="inline-flex items-center gap-1">
              <Globe className="h-4 w-4" /> {startup.geo}
            </span>
            <span className="text-white/40">•</span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Founded{' '}
              {startup.founded.getFullYear()}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            className="whitespace-nowrap bg-emerald-600"
            disabled={pending || interested}
            onClick={() => start(() => onExpressInterest())}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {pending
              ? 'Adding…'
              : interested
              ? 'Interested ✓'
              : 'Express Interest'}
          </Button>

          <Button
            variant={saved ? 'default' : 'outline'}
            className="whitespace-nowrap"
            disabled={pending}
            onClick={() => start(() => onToggleSave())}
          >
            <Heart className="mr-2 h-4 w-4" />
            {saved ? 'Saved ✓' : 'Save'}
          </Button>

          <Button variant="outline" className="whitespace-nowrap">
            <Star className="mr-2 h-4 w-4" />
            Rate
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Kpi
          title="Monthly Revenue"
          main={formatCurrency(startup.mrr)}
          sub={`+${startup.metrics.growth}% MoM`}
          subClass="text-emerald-400"
        />
        <Kpi
          title="Team Size"
          main={startup.teamSize}
          sub="Full-time employees"
        />
        <Kpi
          title="Customers"
          main={startup.metrics.customers}
          sub={`${startup.metrics.retention}% retention`}
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Funding Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(startup.fundingRaised)}
            </div>
            <Progress value={progressPct} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(startup.fundingGoal)} goal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="traction">Traction</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="deck">Pitch Deck</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {startup.description}
                </p>
                {!!startup.sector?.length && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Focus Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {startup.sector.map((s) => (
                        <Badge key={s} variant="secondary">
                          {formatSector(s)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {startup.website && (
                  <div className="mt-4">
                    <a
                      href={startup.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Visit Website →
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Detail
                  label="Organization"
                  value={startup.org?.name || '—'}
                />
                <Detail label="Stage" value={formatStage(startup.stage)} />
                <Detail label="Location" value={startup.geo || '—'} />
                <Detail
                  label="Founded"
                  value={formatDate(startup.founded)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {startup.team.map((m, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-full grid place-items-center">
                      <span className="text-primary-foreground font-medium">
                        {m.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{m.name}</CardTitle>
                      <CardDescription>{m.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{m.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="traction" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {startup.traction.map((t, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.metric}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{t.value}</div>
                  <p
                    className={`text-xs ${
                      t.change.startsWith('+')
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {t.change} from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="updates" className="mt-6">
          <div className="space-y-4">
            {startup.updates.map((u) => (
              <Card key={u.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{u.title}</CardTitle>
                      <CardDescription>{formatDate(u.date)}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{u.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deck" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pitch Deck Preview</CardTitle>
              <CardDescription>
                Request access to view the full pitch deck
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Pitch deck access is restricted to interested investors
              </p>
              <Button>Request Deck Access</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* small UI helpers */
function Kpi({ title, main, sub, subClass = 'text-muted-foreground' }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{main}</div>
        {sub ? <p className={`text-xs mt-1 ${subClass}`}>{sub}</p> : null}
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/60">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
