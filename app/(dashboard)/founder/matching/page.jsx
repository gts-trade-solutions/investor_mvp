// app/founder/smart-matching/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Target,
  MapPin,
  Building2,
  Star,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { formatCurrency, formatSector, formatStage } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

/* ---------------------- Page component ---------------------- */

export default function SmartMatching() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      try {
        setLoading(true);
        setError('');

        // Load real investors from your existing API (DB-backed)
        const res = await fetch('/api/investors', {
          cache: 'no-store',
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || 'Failed to load investors');
        }

        const data = await res.json();
        const rows = data?.investors ?? [];

        // Build Smart-Match objects from real investor rows
        const enriched = rows.map((inv) => {
          const sectors = safeParseArray(inv.sectors);
          const stages = safeParseArray(inv.stages);
          const geos = safeParseArray(inv.geos);

          const fund =
            inv.fund || {
              name: inv.fund_name || 'Fund',
              checkSizeMin: inv.fund_check_min ?? null,
              checkSizeMax: inv.fund_check_max ?? null,
            };

          const matchScore = computeMatchScore({ sectors, stages, geos, fund });
          const matchReasons = buildMatchReasons({
            sectors,
            stages,
            geos,
            fund,
          });

          return {
            id: inv.id,
            investorId: inv.id, // investors.id in DB
            investorUserId: inv.owner ?? null, // auth.users.id from investors.owner
            investor: {
              name: inv.name,
              title: inv.title,
              org: { name: inv.org?.name || inv.org_name || 'Independent' },
              fund,
            },
            matchScore,
            matchReasons,
            sectors,
            stages,
            geos,
          };
        });

        enriched.sort((a, b) => b.matchScore - a.matchScore);

        if (!cancelled) {
          setMatches(enriched);
        }
      } catch (e) {
        console.error('Smart matching error:', e);
        if (!cancelled) {
          setError(e.message || 'Failed to load matches');
          setMatches([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMatches();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Zap className="mr-3 h-8 w-8 text-primary" />
            Smart Matching
          </h1>
          <p className="text-muted-foreground">Loading AI matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Zap className="mr-3 h-8 w-8 text-primary" />
          Smart Matching
        </h1>
        <p className="text-muted-foreground">
          AI-style investor recommendations based on real data from the
          directory. Use your credits to unlock the best matches and connect.
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Matching Algorithm Info */}
      <Card>
        <CardHeader>
          <CardTitle>How We Match You</CardTitle>
          <CardDescription>
            We score each investor using sectors, stage, geography and check
            size. You can later swap this scoring with a real AI API without
            changing the UI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Target className="mx-auto h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium">Sector Focus</h4>
              <p className="text-sm text-muted-foreground">
                Investment thesis alignment
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className="mx-auto h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium">Stage Match</h4>
              <p className="text-sm text-muted-foreground">
                Funding stage preferences
              </p>
            </div>
            <div className="text-center">
              <MapPin className="mx-auto h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium">Geography</h4>
              <p className="text-sm text-muted-foreground">
                Regional investment focus
              </p>
            </div>
            <div className="text-center">
              <Building2 className="mx-auto h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium">Check Size</h4>
              <p className="text-sm text-muted-foreground">
                Ticket size fit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matched Investors */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Top Matches</h2>

        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No matches yet. Add more investors or update your profile.
          </p>
        ) : (
          matches.map((match) => <MatchCard key={match.id} match={match} />)
        )}
      </div>
    </div>
  );
}

/* ---------------------- Match card with credit unlock ---------------------- */

function MatchCard({ match }) {
  // 🔐 CREDIT-UNLOCK STATE
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  // ⭐ SAVE STATE
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const investorId = match.investorId;        // investors.id in DB
  const investorUserId = match.investorUserId; // auth.users.id (owner)
  const canUnlock = Boolean(investorId);
  const canSendPitch = Boolean(investorUserId);

  // 🔍 On mount: check if this investor is already unlocked AND saved
  useEffect(() => {
    if (!canUnlock) return;

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
        .eq('investor_id', investorId);

      if (!cancelled && !error && data && data.length > 0) {
        setUnlocked(true);
      }
    }

    async function checkSaved() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return;

      const { data, error } = await supabase
        .from('saved_investors')
        .select('id')
        .eq('founder_id', user.id)
        .eq('investor_id', investorId);

      if (!cancelled && !error && data && data.length > 0) {
        setSaved(true);
      }
    }

    checkUnlocked();
    checkSaved();

    return () => {
      cancelled = true;
    };
  }, [investorId, canUnlock]);

  // 💳 CREDIT UNLOCK HANDLER – calls Supabase RPC `unlock_investor`
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

      if (!investorId) {
        setUnlockError('This match is not linked to an investor profile yet.');
        return;
      }

      const { data, error } = await supabase.rpc('unlock_investor', {
        p_investor_id: investorId,
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

      // status: 'unlocked' or 'already_unlocked'
      setUnlocked(true);
    } catch (e) {
      console.error(e);
      setUnlockError(e.message || 'Failed to unlock match.');
    } finally {
      setUnlocking(false);
    }
  }

  // ⭐ SAVE / UNSAVE HANDLER
  async function handleToggleSave() {
    try {
      setSaving(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        window.location.href = '/auth/signin';
        return;
      }

      if (!investorId) return;

      if (saved) {
        // Unsave
        const { error } = await supabase
          .from('saved_investors')
          .delete()
          .eq('founder_id', user.id)
          .eq('investor_id', investorId);

        if (error) throw error;
        setSaved(false);
      } else {
        // Save
        const { error } = await supabase
          .from('saved_investors')
          .upsert(
            {
              founder_id: user.id,
              investor_id: investorId,
            },
            { onConflict: 'founder_id,investor_id' }
          );

        if (error) throw error;
        setSaved(true);
      }
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to update saved state.');
    } finally {
      setSaving(false);
    }
  }

  const { investor } = match;
  const orgName = investor.org?.name || '';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{investor.name}</CardTitle>
            <CardDescription>
              {investor.title} at {orgName}
            </CardDescription>
            {unlocked && (
              <span className="mt-1 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                Unlocked
              </span>
            )}
          </div>
          <div className="text-right">
            <div
              className={`text-2xl font-bold ${getMatchColor(
                match.matchScore
              )}`}
            >
              {match.matchScore}%
            </div>
            <div className="text-sm text-muted-foreground">Match Score</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress value={match.matchScore} className="w-full" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Fund Details</h4>
            <p className="text-sm text-muted-foreground mb-1">
              {investor.fund?.name}
            </p>
            <p className="text-sm">
              {formatCurrency(investor.fund?.checkSizeMin)} –{' '}
              {formatCurrency(investor.fund?.checkSizeMax)}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Why This Match?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {(match.matchReasons || [])
                .slice(0, unlocked ? 4 : 2) // show more when unlocked
                .map((reason, index) => (
                  <li key={index} className="flex items-center">
                    <Star className="h-3 w-3 text-primary mr-2" />
                    {reason}
                  </li>
                ))}
              {!unlocked && match.matchReasons?.length > 2 && (
                <li className="text-xs text-muted-foreground italic ml-5">
                  Unlock to see full AI explanation
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium mb-1">Focus Sectors</p>
            <div className="flex flex-wrap gap-1">
              {match.sectors?.map((sector) => (
                <Badge key={sector} variant="secondary" className="text-xs">
                  {formatSector(sector)}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Investment Stages</p>
            <div className="flex flex-wrap gap-1">
              {match.stages?.map((stage) => (
                <Badge key={stage} variant="outline" className="text-xs">
                  {formatStage(stage)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* 🔐 Actions: gated by credits */}
        <div className="flex space-x-2">
          {unlocked ? (
            canSendPitch ? (
              <>
                {/* CONNECT: simple connection message (no deck) */}
                <SendPitchDialog
                  mode="connect"
                  triggerButton={<Button className="flex-1">Connect</Button>}
                  investorUserId={investorUserId}
                  investorDisplayName={`${investor.name} - ${orgName}`}
                />
                {/* SEND PITCH: full deck upload */}
                <SendPitchDialog
                  mode="pitch"
                  triggerButton={
                    <Button variant="outline" className="flex-1">
                      Send Pitch
                    </Button>
                  }
                  investorUserId={investorUserId}
                  investorDisplayName={`${investor.name} - ${orgName}`}
                />
                <Button
                  variant="outline"
                  onClick={handleToggleSave}
                  disabled={saving}
                >
                  {saved ? 'Saved' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Button className="flex-1" disabled>
                  No account linked
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  Send Pitch
                </Button>
                <Button variant="outline" disabled>
                  Save
                </Button>
              </>
            )
          ) : (
            <>
              {/* 👇 THIS BUTTON USES CREDITS VIA unlock_investor RPC */}
              <Button
                className="flex-1 gap-2"
                onClick={handleUnlock}
                disabled={unlocking || !canUnlock}
              >
                <Lock className="h-4 w-4" />
                {unlocking ? 'Unlocking…' : 'Unlock match (1 credit)'}
              </Button>
              <Button variant="outline" disabled className="flex-1">
                Connect
              </Button>
              <Button variant="outline" disabled>
                Save
              </Button>
            </>
          )}
        </div>

        {unlockError && (
          <p className="text-xs text-red-400 mt-1">{unlockError}</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------------- SendPitchDialog ---------------------- */
/**
 * mode = "connect" | "pitch"
 * - connect: simple message, no file upload, notification type INVESTOR_CONNECT
 * - pitch: message + optional deck, notification type INVESTOR_PITCH
 */
function SendPitchDialog({
  triggerButton,
  investorUserId,
  investorDisplayName,
  mode = 'pitch',
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null); // PDF file
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const isConnect = mode === 'connect';

  async function handleSend() {
    try {
      setLoading(true);

      if (!subject.trim() || !message.trim()) {
        alert('Subject and message are required');
        return;
      }

      // auth
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

      let pdfUrl = null;

      // For CONNECT we skip file upload completely
      if (!isConnect && file) {
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

      const notifType = isConnect ? 'INVESTOR_CONNECT' : 'INVESTOR_PITCH';

      // create notification row for this investor
      const { error: notifError } = await supabase.from('notifications').insert({
        recipient_user_id: investorUserId,
        title:
          subject ||
          (isConnect ? 'New connection request' : 'New pitch received'),
        body: message,
        type: notifType,
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
        throw notifError;
      }

      alert(isConnect ? 'Connection request sent!' : 'Pitch sent to investor!');
      setOpen(false);
      setSubject('');
      setMessage('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (e) {
      console.error(e);
      alert(e.message || 'Something went wrong while sending the message.');
    } finally {
      setLoading(false);
    }
  }

  const dialogTitle = isConnect ? 'Connect with investor' : 'Send pitch';
  const messagePlaceholder = isConnect
    ? 'Write a short intro about you and why you want to connect…'
    : 'Introduce your startup, traction, and the ask…';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
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
            placeholder={messagePlaceholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* PDF upload only for pitch */}
          {!isConnect && (
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
          )}
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
            {loading ? 'Sending…' : isConnect ? 'Send request' : 'Send pitch'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------- helpers ---------------------- */

function getMatchColor(score) {
  if (score >= 90) return 'text-green-500';
  if (score >= 75) return 'text-yellow-400';
  return 'text-slate-400';
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

// Simple heuristic – replace with real AI later if you want
function computeMatchScore({ sectors, stages, geos, fund }) {
  let score = 60;

  if (sectors?.length) score += Math.min(sectors.length * 3, 9);
  if (stages?.length) score += Math.min(stages.length * 3, 9);
  if (geos?.length) score += Math.min(geos.length * 3, 9);

  if (fund?.checkSizeMin && fund?.checkSizeMax) {
    const span = fund.checkSizeMax - fund.checkSizeMin;
    if (span > 0) score += 5;
  }

  // clamp between 60–98
  score = Math.max(60, Math.min(98, score));
  return Math.round(score);
}

function buildMatchReasons({ sectors, stages, geos, fund }) {
  const reasons = [];

  if (sectors?.length) {
    reasons.push(
      `Invests in ${sectors
        .slice(0, 2)
        .map((s) => formatSector(s))
        .join(', ')}`
    );
  }

  if (stages?.length) {
    reasons.push(
      `Active in ${stages
        .slice(0, 2)
        .map((s) => formatStage(s))
        .join(', ')} rounds`
    );
  }

  if (geos?.length) {
    reasons.push(`Focus on ${geos.join(', ')} markets`);
  }

  if (fund?.checkSizeMin && fund?.checkSizeMax) {
    reasons.push(
      `Check size from ${formatCurrency(
        fund.checkSizeMin
      )} to ${formatCurrency(fund.checkSizeMax)}`
    );
  }

  if (!reasons.length) {
    reasons.push('Based on investor activity and profile');
  }

  return reasons;
}
