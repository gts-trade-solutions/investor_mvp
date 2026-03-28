// app/(dashboard)/analytics/page.jsx
'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Download,
  Users,
  TrendingUp,
  FileText,
  Clock,
} from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // 1) Logged-in founder
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) {
          window.location.href = '/auth/signin';
          return;
        }

        // 2) Load all their pitch decks
        const { data: decks, error: decksError } = await supabase
          .from('pitch_decks')
          .select('id, name, views, downloads, created_at')
          .eq('user_id', user.id);

        if (decksError) throw decksError;

        const safeDecks = decks || [];

        // 3) Optionally: load view events (if you've created the table)
        const { data: viewEvents, error: viewsError } = await supabase
          .from('pitch_deck_view_events')
          .select(
            'id, deck_id, viewer_id, viewer_email, view_time_seconds, pages_viewed, viewed_at'
          )
          .in(
            'deck_id',
            safeDecks.map((d) => d.id)
          )
          .order('viewed_at', { ascending: false })
          .limit(50); // latest 50 events

        if (viewsError && viewsError.code !== 'PGRST116') {
          // PGRST116 = "relation does not exist" if table not created yet
          throw viewsError;
        }

        const events = viewEvents || [];

        // ---------- Aggregate metrics ----------
        const totalViews = safeDecks.reduce(
          (sum, d) => sum + (d.views || 0),
          0
        );
        const totalDownloads = safeDecks.reduce(
          (sum, d) => sum + (d.downloads || 0),
          0
        );

        // unique viewers from events (viewer_id preferred, fallback viewer_email)
        const viewerKeys = new Set(
          events.map((e) => e.viewer_id || e.viewer_email).filter(Boolean)
        );
        const uniqueViewers = viewerKeys.size;

        // average view time from events
        const avgViewTime =
          events.length > 0
            ? Math.round(
                events.reduce(
                  (sum, e) => sum + (e.view_time_seconds || 0),
                  0
                ) / events.length
              )
            : 0;

        // top decks by views
        const topDecks = [...safeDecks]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 3)
          .map((d) => {
            // average view time per deck from events
            const deckEvents = events.filter((e) => e.deck_id === d.id);
            const deckAvgViewTime =
              deckEvents.length > 0
                ? Math.round(
                    deckEvents.reduce(
                      (sum, e) => sum + (e.view_time_seconds || 0),
                      0
                    ) / deckEvents.length
                  )
                : 0;

            // last viewed from events
            const lastViewed =
              deckEvents.length > 0
                ? new Date(deckEvents[0].viewed_at)
                : d.created_at
                ? new Date(d.created_at)
                : new Date();

            return {
              id: d.id,
              name: d.name,
              views: d.views || 0,
              downloads: d.downloads || 0,
              avgViewTime: deckAvgViewTime,
              lastViewed,
            };
          });

        // recent views activity
        const recentViews = events.slice(0, 10).map((e) => {
          const deck = safeDecks.find((d) => d.id === e.deck_id);
          return {
            id: e.id,
            deckName: deck?.name || 'Unknown deck',
            viewerEmail: e.viewer_email || 'Unknown viewer',
            viewTime: e.view_time_seconds || 0,
            pagesViewed: e.pages_viewed || 0,
            timestamp: e.viewed_at ? new Date(e.viewed_at) : new Date(),
          };
        });

        const payload = {
          totalViews,
          totalDownloads,
          uniqueViewers,
          avgViewTime,
          topDecks,
          recentViews,
        };

        if (!cancelled) {
          setAnalytics(payload);
        }
      } catch (err) {
        console.error('Analytics load error:', err);
        if (!cancelled) {
          setAnalytics({
            totalViews: 0,
            totalDownloads: 0,
            uniqueViewers: 0,
            avgViewTime: 0,
            topDecks: [],
            recentViews: [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatViewTime = (seconds) => {
    const minutes = Math.floor((seconds || 0) / 60);
    const remainingSeconds = (seconds || 0) % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // ---------- UI (same as yours, but using real analytics) ----------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track engagement with your pitch decks and investor interest
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics.totalViews)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all pitch decks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analytics.totalDownloads)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total file downloads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.uniqueViewers}
            </div>
            <p className="text-xs text-muted-foreground">
              Individual investors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. View Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatViewTime(analytics.avgViewTime)}
            </div>
            <p className="text-xs text-muted-foreground">Per deck session</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Decks */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Decks</CardTitle>
          <CardDescription>
            Your most viewed and downloaded pitch decks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topDecks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No deck activity yet.
              </p>
            ) : (
              analytics.topDecks.map((deck, index) => (
                <div
                  key={deck.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                      <span className="text-sm font-medium text-primary">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{deck.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last viewed {formatDate(deck.lastViewed)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{deck.views}</div>
                      <div className="text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{deck.downloads}</div>
                      <div className="text-muted-foreground">Downloads</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">
                        {formatViewTime(deck.avgViewTime)}
                      </div>
                      <div className="text-muted-foreground">Avg. Time</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Viewing Activity</CardTitle>
          <CardDescription>
            Latest interactions with your pitch decks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentViews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent views yet.
              </p>
            ) : (
              analytics.recentViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">{view.deckName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Viewed by {view.viewerEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div>{formatViewTime(view.viewTime)}</div>
                    <div>{view.pagesViewed} pages</div>
                    <div>{formatDate(view.timestamp)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
