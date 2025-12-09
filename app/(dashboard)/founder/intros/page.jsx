'use client';

import { useEffect, useState } from 'react';
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
import {
  Plus,
  Users,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { RequestIntroDialog } from '@/components/founder/request-intro-dialog';

/* ---------------------- helpers for status badge ---------------------- */

function getStatusBadge(status) {
  switch (status) {
    case 'REQUESTED':
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Clock className="mr-1 h-3 w-3" />
          Requested
        </Badge>
      );
    case 'SENT':
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <MessageCircle className="mr-1 h-3 w-3" />
          Sent
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    case 'DECLINED':
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <XCircle className="mr-1 h-3 w-3" />
          Declined
        </Badge>
      );
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}

// Map DB row -> UI object
function mapIntroRow(row) {
  return {
    id: row.id,
    fromUser: { name: row.connector_label || 'Connector', email: '' },
    toUser: { name: row.investor_label || 'Investor', email: '' },
    startup: { name: '' },
    status: row.status || 'REQUESTED',
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    message: row.message || '',
  };
}

/* ---------------------- Page component ---------------------- */

export default function Introductions() {
  const [intros, setIntros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadIntros() {
      setLoading(true);
      setError(null);

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

        const { data, error: introError } = await supabase
          .from('founder_introductions')
          .select(
            `
            id,
            investor_label,
            connector_label,
            message,
            status,
            created_at,
            founder_id
          `,
          )
          .eq('founder_id', user.id)
          .order('created_at', { ascending: false });

        if (introError) throw introError;

        if (!cancelled) {
          const mapped = (data || []).map(mapIntroRow);
          setIntros(mapped);
        }
      } catch (err) {
        console.error('Error loading introductions:', err);
        if (!cancelled) {
          setError(err.message || 'Failed to load introductions');
          setIntros([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadIntros();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleIntroCreated(dbRow) {
    setIntros((prev) => [mapIntroRow(dbRow), ...prev]);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Introductions</h1>
          <p className="text-muted-foreground">Loading introductions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Introductions</h1>
          <p className="text-muted-foreground">
            Request warm introductions to investors through your network. Unlock each intro
            with credits to view full details.
          </p>
          {error && (
            <p className="text-xs text-red-500 mt-1">
              {error}
            </p>
          )}
        </div>

        <RequestIntroDialog onCreated={handleIntroCreated} />
      </div>

      {/* Credits info */}
      <Card>
        <CardContent className="py-3 text-sm text-muted-foreground flex items-center justify-between">
          <span>
            🔐 Viewing full introduction details costs{' '}
            <span className="font-medium text-emerald-500">1 credit</span>{' '}
            the first time. Once unlocked, it stays unlocked.
          </span>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {intros.filter((i) => i.status === 'REQUESTED').length}
            </div>
            <div className="text-sm text-muted-foreground">Requested</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {intros.filter((i) => i.status === 'SENT').length}
            </div>
            <div className="text-sm text-muted-foreground">Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {intros.filter((i) => i.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {intros.filter((i) => i.status === 'DECLINED').length}
            </div>
            <div className="text-sm text-muted-foreground">Declined</div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-4">
        {intros.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No introduction requests yet.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  // Optional: open RequestIntroDialog via global state
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Request Your First Introduction
              </Button>
            </CardContent>
          </Card>
        ) : (
          intros.map((intro) => (
            <IntroCard key={intro.id} intro={intro} />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------------- IntroCard with credit unlock ---------------------- */

function IntroCard({ intro }) {
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState(null);

  // On mount: check if this intro is already unlocked for current founder
  useEffect(() => {
    let cancelled = false;

    async function checkUnlocked() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return;

      const { data, error } = await supabase
        .from('unlocked_introductions')
        .select('id')
        .eq('founder_id', user.id)
        .eq('intro_id', intro.id);

      if (!cancelled && !error && data && data.length > 0) {
        setUnlocked(true);
      }
    }

    checkUnlocked();
    return () => {
      cancelled = true;
    };
  }, [intro.id]);

  // Credit unlock handler
  async function handleUnlock() {
    try {
      setUnlocking(true);
      setUnlockError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        window.location.href = '/auth/signin';
        return;
      }

      const { data, error } = await supabase.rpc('unlock_intro', {
        p_intro_id: intro.id,
      });

      if (error) {
        console.error('unlock_intro error:', error);
        throw error;
      }

      if (data?.status === 'insufficient_credits') {
        setUnlockError(
          'Not enough credits. Go to Billing & Credits to top up.',
        );
        return;
      }

      // status: 'unlocked' or 'already_unlocked'
      setUnlocked(true);
    } catch (e) {
      console.error(e);
      setUnlockError(e.message || 'Failed to unlock introduction.');
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              Introduction to {intro.toUser.name}
            </CardTitle>
            <CardDescription>
              Requested from {intro.fromUser.name} • {formatDate(intro.createdAt)}
            </CardDescription>
          </div>
          {getStatusBadge(intro.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">From:</p>
            <p className="text-muted-foreground">
              {intro.fromUser.name}
            </p>
          </div>
          <div>
            <p className="font-medium">To:</p>
            <p className="text-muted-foreground">
              {intro.toUser.name}
            </p>
          </div>
        </div>

        <div>
          <p className="font-medium text-sm mb-1">Message:</p>
          {unlocked ? (
            <p className="text-muted-foreground text-sm">
              {intro.message || 'No message provided.'}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              This introduction&apos;s full message is locked. Unlock it with credits to
              see all the details.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          {unlocked ? (
            <p className="text-xs text-emerald-500">
              ✅ Unlocked using credits. You&apos;ll keep access forever.
            </p>
          ) : (
            <Button
              size="sm"
              variant="default"
              className="gap-1 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleUnlock}
              disabled={unlocking}
            >
              <Lock className="mr-1 h-3 w-3" />
              {unlocking ? 'Unlocking…' : 'Unlock intro (1 credit)'}
            </Button>
          )}

          {unlockError && (
            <span className="text-xs text-red-500 ml-3">
              {unlockError}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
