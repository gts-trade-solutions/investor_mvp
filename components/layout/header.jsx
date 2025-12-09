'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { Bell, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const [credits, setCredits] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  // hydrate auth on mount + subscribe to auth changes
  useEffect(() => {
    let authSub;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      authSub = supabase.auth
        .onAuthStateChange((_evt, sess) => {
          setUser(sess?.user ?? null);
        }).data.subscription;
    })();

    return () => authSub?.unsubscribe();
  }, []);

  // load credits from user_credits table
  useEffect(() => {
    if (!user?.id) {
      setCredits(null);
      return;
    }

    let cancelled = false;

    async function fetchCredits() {
      setCreditsLoading(true);

      const { data, error } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data) {
        setCredits(data.credits ?? 0);
      } else {
        setCredits(0);
      }

      setCreditsLoading(false);
    }

    fetchCredits();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // load unread notifications count
  useEffect(() => {
    if (!user?.id) return;
    let channel;

    async function refreshCount() {
      const { count } = await supabase
        .from('notifications')
        .select('*', { head: true, count: 'exact' })
        .eq('recipient_user_id', user.id)
        .eq('is_read', false);

      setUnread(count || 0);
    }

    refreshCount();

    channel = supabase
      .channel('notif_badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${user.id}`,
        },
        refreshCount
      )
      .subscribe();

    return () => channel && supabase.removeChannel(channel);
  }, [user?.id]);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/signin';
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b">
      <Link href="/" className="text-base font-medium hover:text-primary">
        Home
      </Link>

      <div className="flex items-center gap-3">
        {/* Credits badge */}
        {user && (
          <Link
            href="/billing"
            className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs hover:bg-muted"
          >
            <Coins className="h-4 w-4" />
            <span>
              {creditsLoading ? 'Loading…' : `${credits ?? 0} credits`}
            </span>
          </Link>
        )}

        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {user?.id && unread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>

        {user ? (
          <>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
            <Button variant="outline" onClick={onSignOut}>
              Sign out
            </Button>
          </>
        ) : (
          <Link href="/auth/signin">
            <Button>Sign in</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
