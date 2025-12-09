// app/founder/directory/page.jsx
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import supabase from '@/lib/supabaseClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Building2, DollarSign, Lock } from 'lucide-react';
import { InvestorFiltersDialog } from '@/components/founder/investor-filters-dialog';
import { SavedListsDropdown } from '@/components/founder/saved-lists-dropdown';
import { formatCurrency, formatSector, formatStage } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

/* ---------------------- Dev fallback investors --------------------- */

const MOCK_INVESTORS = [
  {
    id: '1',
    name: 'John Carter',
    title: 'Managing Partner',
    org: { name: 'Crescent Ventures' },
    fund: { checkSizeMin: 250000, checkSizeMax: 2000000 },
    sectors: JSON.stringify(['AI', 'FinTech', 'HealthTech']),
    stages: JSON.stringify(['seed', 'series_a']),
    notes: 'Focused on early-stage AI-driven tools for productivity.',
  },
  {
    id: '2',
    name: 'Priya Nair',
    title: 'Angel Investor',
    org: { name: 'Independent' },
    fund: { checkSizeMin: 50000, checkSizeMax: 250000 },
    sectors: JSON.stringify(['EdTech', 'SaaS', 'CleanTech']),
    stages: JSON.stringify(['pre_seed', 'seed']),
    notes: 'Backs strong women founders and impact-focused startups.',
  },
  {
    id: '3',
    name: 'Michael Zhang',
    title: 'Partner',
    org: { name: 'BluePeak Capital' },
    fund: { checkSizeMin: 1000000, checkSizeMax: 5000000 },
    sectors: JSON.stringify(['ClimateTech', 'Mobility', 'Energy']),
    stages: JSON.stringify(['series_a', 'series_b']),
    notes: 'Sustainability and clean energy transition globally.',
  },
];

/* ---------------------- Main directory page --------------------- */

export default function InvestorDirectory() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    sectors: [],
    stages: [],
    geos: [],
    checkSizeRange: [0, 10_000_000], // $0–$10M
  });

  const USE_DEV_FALLBACK = false;
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams({
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(filters.sectors.length && {
            sectors: filters.sectors.join(','),
          }),
          ...(filters.stages.length && {
            stages: filters.stages.join(','),
          }),
          ...(filters.geos.length && { geos: filters.geos.join(',') }),
          checkSizeMin: String(filters.checkSizeRange[0]),
          checkSizeMax: String(filters.checkSizeRange[1]),
        });

        const res = await fetch(`/api/investors?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || 'Failed to load');
        }

        const data = await res.json();
        const rows = data?.investors ?? [];

        console.log('Loaded investors:', rows);

        if (rows.length === 0 && USE_DEV_FALLBACK) {
          setInvestors(MOCK_INVESTORS);
        } else {
          setInvestors(rows);
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
        console.error(e);
        setError(e.message || 'Something went wrong');
        if (USE_DEV_FALLBACK) setInvestors(MOCK_INVESTORS);
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [debouncedSearch, filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Investor Directory</h1>
        <p className="text-muted-foreground">
          Discover investors that match your startup’s profile
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search investors (name, title, org)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <InvestorFiltersDialog
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
        <SavedListsDropdown />
      </div>

      {/* Status line */}
      <div className="flex items-center gap-3">
        {loading && (
          <span className="text-sm text-muted-foreground">Loading…</span>
        )}
        {!!error && <span className="text-sm text-red-500">{error}</span>}
        {!loading && !error && (
          <span className="text-sm text-muted-foreground">
            Showing <strong>{investors.length}</strong> result
            {investors.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : investors.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground">
            No investors found. Try broadening your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {investors.map((inv) => (
            <InvestorCard key={inv.id || inv.owner} inv={inv} />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------- SendPitchDialog -------------------- */

function SendPitchDialog({ triggerButton, investorUserId, investorDisplayName }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null); // PDF file
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSend() {
    try {
      setLoading(true);

      if (!subject.trim() || !message.trim()) {
        alert('Subject and message are required');
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) {
        window.location.href = '/auth/signin';
        return;
      }

      if (!investorUserId) {
        alert('This investor row has no linked user id (owner).');
        return;
      }

      // upload PDF to "pdf-bucket" (if attached)
      let pdfUrl = null;

      if (file) {
        const ext = file.name.split('.').pop() || 'pdf';
        const path = `pitches/${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('pdf-bucket')
          .upload(path, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: publicData } = supabase.storage
          .from('pdf-bucket')
          .getPublicUrl(uploadData.path);

        pdfUrl = publicData.publicUrl;
      }

      // create notification row for this investor
      const { error: notifError } = await supabase.from('notifications').insert({
        recipient_user_id: investorUserId, // text or uuid stored as text
        title: subject || 'New pitch received',
        body: message,
        type: 'INVESTOR_PITCH',
        data: {
          from_user_id: user.id,
          from_email: user.email,
          from_name: user.user_metadata?.full_name || null,
          deck_url: pdfUrl,
        },
        is_read: false,
      });

      if (notifError) {
        console.error('Notification insert error:', notifError);
        // This is where you were seeing "new row violates row-level security policy"
        alert(`Notification error: ${notifError.message}`);
        return;
      }

      alert('Pitch sent to investor!');
      setOpen(false);
      setSubject('');
      setMessage('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      console.error(e);
      alert(e.message || 'Something went wrong while sending the pitch.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send pitch</DialogTitle>
        </DialogHeader>

        {investorDisplayName && (
          <div className="text-sm text-muted-foreground">
            To:&nbsp;
            <span className="font-medium">{investorDisplayName}</span>
          </div>
        )}

        <div className="space-y-4 mt-2">
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Textarea
            rows={8}
            placeholder="Introduce your startup, traction, and the ask…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* PDF upload */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Pitch deck (PDF, optional)</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </Button>
              <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                {file ? file.name : 'No file chosen'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSend} disabled={loading}>
            {loading ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------- Investor Card (with credits unlock) ------------------------ */

function InvestorCard({ inv }) {
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [pending, startTransition] = useTransition();

  const sectors = safeParseArray(inv.sectors);
  const stages = safeParseArray(inv.stages);
  const orgName = inv?.org?.name || inv.org_name || 'Independent';
  const fund =
    inv.fund || {
      checkSizeMin: inv.fund_check_min ?? null,
      checkSizeMax: inv.fund_check_max ?? null,
    };

  // auth.users.id of investor that owns this profile
  const investorUserId = inv.owner;
  const canSendPitch = !!investorUserId;

  // When card mounts, check if already unlocked in Supabase
  useEffect(() => {
    let cancelled = false;

    async function checkUnlocked() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return;

      const { data, error } = await supabase
        .from('unlocked_investors')
        .select('id')
        .eq('founder_id', user.id)
        .eq('investor_id', inv.id.toString()); // keep consistent with unlock_investor

      if (!cancelled && !error && data && data.length > 0) {
        setUnlocked(true);
      }
    }

    checkUnlocked();

    return () => {
      cancelled = true;
    };
  }, [inv.id]);

  async function handleUnlock() {
    try {
      setUnlocking(true);
      setUnlockError('');

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        window.location.href = '/auth/signin';
        return;
      }

      const { data, error } = await supabase.rpc('unlock_investor', {
        p_investor_id: inv.id.toString(), // text, matches unlocked_investors.investor_id
      });

      if (error) {
        console.error('unlock_investor error:', error);
        throw error;
      }

      if (data?.status === 'insufficient_credits') {
        setUnlockError(
          'Not enough credits. Go to Billing & Credits to top up.'
        );
        return;
      }

      setUnlocked(true);
      // optionally refresh header credits
      // window.location.reload();
    } catch (e) {
      console.error(e);
      setUnlockError(e.message || 'Failed to unlock investor.');
    } finally {
      setUnlocking(false);
    }
  }

  let primaryAction = null;

  if (!canSendPitch) {
    primaryAction = (
      <Button size="sm" variant="outline" disabled>
        No account linked
      </Button>
    );
  } else if (!unlocked) {
    primaryAction = (
      <Button
        size="sm"
        onClick={handleUnlock}
        disabled={unlocking}
        className="gap-2"
      >
        <Lock className="h-3 w-3" />
        {unlocking ? 'Unlocking…' : 'Unlock investor (1 credit)'}
      </Button>
    );
  } else {
    primaryAction = (
      <SendPitchDialog
        triggerButton={<Button size="sm">Send pitch</Button>}
        investorUserId={investorUserId}
        investorDisplayName={`${inv.name} - ${orgName}`}
      />
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{inv.name}</CardTitle>
            <CardDescription>{inv.title}</CardDescription>
            {unlocked && (
              <span className="mt-1 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                Unlocked
              </span>
            )}
          </div>

          {primaryAction}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>{orgName}</span>
        </div>

        {fund && (fund.checkSizeMin != null || fund.checkSizeMax != null) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>
              {fund.checkSizeMin != null
                ? formatCurrency(fund.checkSizeMin)
                : '—'}
              {' – '}
              {fund.checkSizeMax != null
                ? formatCurrency(fund.checkSizeMax)
                : '—'}
            </span>
          </div>
        )}

        <div className="space-y-2">
          {!!sectors.length && (
            <div>
              <p className="text-sm font-medium mb-1">Sectors</p>
              <div className="flex flex-wrap gap-1">
                {sectors.slice(0, 6).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {formatSector(s)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {!!stages.length && (
            <div>
              <p className="text-sm font-medium mb-1">Stages</p>
              <div className="flex flex-wrap gap-1">
                {stages.slice(0, 6).map((st) => (
                  <Badge key={st} variant="outline" className="text-xs">
                    {formatStage(st)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {inv.notes && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {inv.notes}
          </p>
        )}

        {unlockError && (
          <p className="text-xs text-red-400 mt-1">{unlockError}</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------ Skeleton grid ------------------------ */

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* --------------------------- utils --------------------------- */

function useDebounce(value, delay = 300) {
  const [v, setV] = useState(value);
  const t = useRef();

  useEffect(() => {
    clearTimeout(t.current);
    t.current = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t.current);
  }, [value, delay]);

  return v;
}

function safeParseArray(v) {
  if (Array.isArray(v)) return v;
  try {
    const parsed = JSON.parse(v ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
