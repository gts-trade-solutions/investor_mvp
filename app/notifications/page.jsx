'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // load auth user
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth/signin';
        return;
      }
      setUser(user);
    })();
  }, []);

  // load notifications for this user
  useEffect(() => {
    if (!user?.id) return;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('notifications from DB', data);
        setNotifications(data || []);

        // optional: mark all unread as read when page is opened
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('recipient_user_id', user.id)
          .eq('is_read', false);
      } catch (e) {
        console.error('Failed to load notifications:', e);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user?.id]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading notifications…</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You don’t have any notifications yet.
        </p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            // Try to safely extract pdfUrl from different possible shapes
            let pdfUrl = null;

            if (n.data) {
              try {
                const parsed =
                  typeof n.data === 'string' ? JSON.parse(n.data) : n.data;

                pdfUrl =
                  parsed?.pdf_url ||
                  parsed?.pitch_deck_url ||
                  parsed?.deck_url ||
                  parsed?.url;
              } catch (e) {
                console.warn('Failed to parse notification.data', n.data, e);
              }
            }

            // Fallback: maybe you stored it as a top-level column
            if (!pdfUrl && n.pdf_url) {
              pdfUrl = n.pdf_url;
            }

            return (
              <Card
                key={n.id}
                className={!n.is_read ? 'border-primary/40 bg-primary/5' : ''}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {n.title || 'Notification'}
                  </CardTitle>
                  {n.created_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {n.body || 'No message provided.'}
                  </p>

                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex text-xs text-primary hover:underline"
                    >
                      View pitch deck
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
