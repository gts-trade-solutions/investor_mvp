// app/investor/startups/page.jsx
'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import supabase from '@/lib/supabaseClient';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const PAGE_SIZE = 9;

export default function InvestorStartups() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [stage, setStage] = useState('');
  const [sector, setSector] = useState(''); // maps to `industry`
  const [geo, setGeo] = useState(''); // maps to `country`
  const [page, setPage] = useState(1);

  const debouncedQ = useDebounce(q, 300);

  useEffect(() => {
    let cancel = false;

    (async () => {
      setLoading(true);

      // 1) Load startups (paged) from founders table
      let query = supabase
        .from('founders')
        .select(
          `
          user_id,
          company_name,
          website,
          industry,
          country,
          stage,
          team_size,
          capital_raised_usd,
          tagline,
          problem_solution,
          updated_at
        `,
          { count: 'exact' }
        );

      // TEXT SEARCH: company_name / tagline / industry
      if (debouncedQ) {
        const term = `%${debouncedQ}%`;
        query = query.or(
          `company_name.ilike.${term},tagline.ilike.${term},industry.ilike.${term}`
        );
      }

      // FILTERS
      if (stage) query = query.eq('stage', stage);
      if (sector) query = query.eq('industry', sector);
      if (geo) query = query.eq('country', geo);

      // newest updated first
      query = query.order('updated_at', { ascending: false });

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data: startups, count, error } = await query.range(from, to);

      if (error) {
        if (!cancel) {
          console.error('FOUNDERS QUERY ERROR', error);
          setItems([]);
          setTotal(0);
          setLoading(false);
        }
        return;
      }

      // 2) Fetch interest/saves for CURRENT user (batch by visible startup ids)
      let interestedSet = new Set();
      let savedSet = new Set();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && startups?.length) {
          const ids = startups.map((s) => s.user_id);

          // Pipeline interest
          const { data: pipelineRows, error: pipelineFetchError } =
            await supabase
              .from('investor_pipeline')
              .select('startup_id')
              .eq('investor_id', user.id)
              .in('startup_id', ids);

          if (pipelineFetchError) {
            console.warn('PIPELINE FETCH ERROR', pipelineFetchError);
          } else if (Array.isArray(pipelineRows)) {
            interestedSet = new Set(pipelineRows.map((r) => r.startup_id));
          }

          // Saves
          const { data: saveRows, error: savesFetchError } = await supabase
            .from('investor_saves')
            .select('startup_id')
            .eq('investor_id', user.id)
            .in('startup_id', ids);

          if (savesFetchError) {
            console.warn('SAVES FETCH ERROR', savesFetchError);
          } else if (Array.isArray(saveRows)) {
            savedSet = new Set(saveRows.map((r) => r.startup_id));
          }
        }
      } catch (e) {
        console.warn('Could not resolve user interest/saves:', e?.message || e);
      }

      if (!cancel) {
        // 3) Decorate startups with flags
        const decorated = (startups || []).map((s) => ({
          ...s,
          __interested: interestedSet.has(s.user_id),
          __saved: savedSet.has(s.user_id),
        }));

        setItems(decorated);
        setTotal(count || 0);
        setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [debouncedQ, stage, sector, geo, page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Startup Directory</h1>
        <p className="text-muted-foreground">
          Discover promising startups seeking investment
        </p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl p-4 border border-white/10">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search startups…"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            className="pl-10 text-white placeholder:text-neutral-400 border-neutral-700 focus-visible:ring-neutral-700"
          />
        </div>

        <select
          className="border border-neutral-700 rounded px-3 py-2 text-sm bg-neutral-900 text-white focus:ring-2 focus:ring-neutral-700"
          value={stage}
          onChange={(e) => {
            setPage(1);
            setStage(e.target.value);
          }}
        >
          <option value="">All Stages</option>
          <option value="idea">Idea</option>
          <option value="pre_seed">Pre Seed</option>
          <option value="seed">Seed</option>
          <option value="series_a">Series A</option>
          <option value="series_b">Series B</option>
        </select>

        <select
          className="border border-neutral-700 rounded px-3 py-2 text-sm bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-neutral-700"
          value={sector}
          onChange={(e) => {
            setPage(1);
            setSector(e.target.value);
          }}
        >
          <option value="">All Industries</option>
          <option value="AI">AI</option>
          <option value="SaaS">SaaS</option>
          <option value="FinTech">FinTech</option>
          <option value="HealthTech">HealthTech</option>
          <option value="ClimateTech">ClimateTech</option>
        </select>

        <select
          className="border border-neutral-700 rounded px-3 py-2 text-sm bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-neutral-700"
          value={geo}
          onChange={(e) => {
            setPage(1);
            setGeo(e.target.value);
          }}
        >
          <option value="">All Countries</option>
          <option value="India">India</option>
          <option value="USA">USA</option>
          <option value="UK">UK</option>
          <option value="Germany">Germany</option>
          <option value="France">France</option>
        </select>

        <Button
          type="button"
          variant="outline"
          className="bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
          onClick={() => {
            setQ('');
            setStage('');
            setSector('');
            setGeo('');
            setPage(1);
          }}
        >
          <Filter className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground">
          No startups match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((s) => (
            <StartupCard
              key={s.user_id}
              s={s}
              initialInterested={!!s.__interested}
              initialSaved={!!s.__saved}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------ Startup Card ------------------ */

function StartupCard({ s, initialInterested, initialSaved }) {
  const [pending, startTransition] = useTransition();
  const [interested, setInterested] = useState(!!initialInterested);
  const [saved, setSaved] = useState(!!initialSaved);

  // Express interest: add to pipeline (stage = "to_contact") + save + notify founder
  async function onExpressInterest() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        window.location.href = '/auth/signin';
        return;
      }

      const payload = {
        investor_id: user.id,
        startup_id: s.user_id, // founder's auth user_id (as stored in founders.user_id)
        stage: 'to_contact',
      };

      // 1) Add / update pipeline row
      const { error: pipelineError } = await supabase
        .from('investor_pipeline')
        .upsert(payload, { onConflict: 'investor_id,startup_id' });

      if (pipelineError) {
        console.error('PIPELINE UPSERT ERROR', pipelineError);
        alert(pipelineError.message);
        return;
      }

      // 2) ALSO save it for this investor
      const { error: saveError } = await supabase
        .from('investor_saves')
        .upsert(
          {
            investor_id: user.id,
            startup_id: s.user_id,
          },
          { onConflict: 'investor_id,startup_id' }
        );

      if (saveError) {
        console.error('SAVES UPSERT ERROR', saveError);
        alert(saveError.message);
        return;
      }

      // 3) Create notification for this founder
      const founderId = s.user_id; // must be auth.users.id

      if (founderId) {
        const investorName =
          user.user_metadata?.full_name || user.email || 'An investor';

        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            recipient_user_id: founderId,
            title: 'New investor interest',
            body: `${investorName} has expressed interest in your startup ${
              s.company_name || ''
            }.`,
            type: 'INVESTOR_PITCH',
          });

        if (notifError) {
          console.error('Notification insert error:', notifError);
          alert(`Notification error: ${notifError.message}`);
        }
      }

      setInterested(true);
      setSaved(true);
    } catch (e) {
      console.error('onExpressInterest ERROR', e);
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

      if (!saved) {
        const { error } = await supabase
          .from('investor_saves')
          .upsert(
            { investor_id: user.id, startup_id: s.user_id },
            { onConflict: 'investor_id,startup_id' }
          );

        if (error) {
          console.error('SAVE UPSERT ERROR', error);
          alert(error.message);
          return;
        }
        setSaved(true);
      } else {
        const { error } = await supabase
          .from('investor_saves')
          .delete()
          .eq('investor_id', user.id)
          .eq('startup_id', s.user_id);

        if (error) {
          console.error('SAVE DELETE ERROR', error);
          alert(error.message);
          return;
        }
        setSaved(false);
      }
    } catch (e) {
      console.error('onToggleSave ERROR', e);
      alert(e?.message || 'Failed to toggle save');
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle className="text-lg">
            {s.company_name || 'Untitled company'}
          </CardTitle>
          <CardDescription>{s.tagline || 'No tagline yet'}</CardDescription>
        </div>
        <Link href={`/investor/startup/${s.user_id}`}>
          <Button size="sm">View Details</Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {s.problem_solution || 'No description provided.'}
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div>
            Stage{' '}
            <span className="ml-1 font-medium capitalize">
              {s.stage || '—'}
            </span>
          </div>
          <div>
            Team size{' '}
            <span className="ml-1 font-medium">
              {s.team_size ? `${s.team_size} people` : '—'}
            </span>
          </div>
          <div>
            Capital raised{' '}
            <span className="ml-1 font-medium">
              {s.capital_raised_usd
                ? formatCurrency(Number(s.capital_raised_usd))
                : '—'}
            </span>
          </div>
          <div>{s.country || '—'}</div>
        </div>

        {s.industry && (
          <div>
            <p className="text-sm font-medium mb-2">Industry</p>
            <Badge variant="secondary" className="text-xs">
              {s.industry}
            </Badge>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled={pending || interested}
            className="bg-emerald-600"
            onClick={() => startTransition(() => onExpressInterest())}
          >
            {pending
              ? 'Adding…'
              : interested
              ? 'Interested ✓'
              : 'Express Interest'}
          </Button>

          <Button
            type="button"
            variant={saved ? 'default' : 'outline'}
            disabled={pending}
            onClick={() => startTransition(() => onToggleSave())}
          >
            {saved ? 'Saved ✓' : 'Save'}
          </Button>

          {s.website && (
            <a
              href={s.website}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-500 text-sm"
            >
              Visit Website →
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------ debounce hook ------------------ */

function useDebounce(v, d = 300) {
  const [x, setX] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setX(v), d);
    return () => clearTimeout(t);
  }, [v, d]);
  return x;
}
