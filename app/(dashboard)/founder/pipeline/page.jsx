// app/founder/pipeline/page.jsx
'use client';

import { useEffect, useState, useRef } from 'react';
import supabase from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updatePipelineStageAction } from '@/app/actions/startups';
import { Paperclip, Pin, PinOff, FileText, Lock } from 'lucide-react';

/* ─────────────────── Main page ─────────────────── */

export default function FounderPipeline() {
  const [rows, setRows] = useState({
    to_contact: [],
    discussion: [],
    closed: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        setLoading(true);

        // 1) Who is the logged-in founder?
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) {
          window.location.href = '/auth/signin';
          return;
        }
        setCurrentUserId(user.id);

        // 2) Pipeline rows where THIS founder is the startup owner
        const {
          data: pipelineRows,
          error: pipelineError,
        } = await supabase
          .from('investor_pipeline')
          .select('id, stage, created_at, investor_id, startup_id')
          .eq('startup_id', user.id)
          .order('created_at', { ascending: false });

        if (pipelineError) throw pipelineError;
        let enriched = pipelineRows || [];

        // 3) Look up investor names from profiles
        if (enriched.length) {
          const investorIds = Array.from(
            new Set(enriched.map((r) => r.investor_id).filter(Boolean))
          );

          let investorsById = {};
          if (investorIds.length) {
            const { data: profs, error: profErr } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', investorIds);

            if (!profErr && profs) {
              investorsById = {};
              for (const p of profs) {
                const safeName =
                  (p.full_name && p.full_name.trim()) ||
                  `(no profile) ${String(p.id).slice(0, 8)}…`;
                investorsById[p.id] = safeName;
              }
            } else if (profErr) {
              console.error('profiles lookup error:', profErr);
            }
          }

          enriched = enriched.map((r) => {
            const invId = r.investor_id;
            const fallbackId = invId ? String(invId).slice(0, 8) : 'unknown';
            const name =
              investorsById[invId] || `(missing profile) ${fallbackId}…`;

            return {
              ...r,
              investor: {
                id: invId,
                name: name || 'Unknown investor',
              },
            };
          });
        }

        // 4) Which pipeline chats are already unlocked for this founder?
        let unlockedSet = new Set();
        const { data: unlockedRows, error: unlockedErr } = await supabase
          .from('unlocked_pipeline_chats')
          .select('pipeline_id')
          .eq('user_id', user.id);

        if (!unlockedErr && unlockedRows) {
          unlockedSet = new Set(unlockedRows.map((r) => r.pipeline_id));
        } else if (unlockedErr) {
          console.error('unlocked_pipeline_chats error:', unlockedErr);
        }

        // 5) Group by stage + attach unlocked flag
        if (cancel) return;

        const grouped = { to_contact: [], discussion: [], closed: [] };
        for (const r of enriched) {
          const rowWithUnlock = { ...r, unlocked: unlockedSet.has(r.id) };
          if (grouped[rowWithUnlock.stage]) {
            grouped[rowWithUnlock.stage].push(rowWithUnlock);
          }
        }

        setRows(grouped);
      } catch (err) {
        console.error('Founder pipeline load error:', err);
        if (!cancel) {
          setRows({ to_contact: [], discussion: [], closed: [] });
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Pipeline</h1>

      {loading ? (
        'Loading…'
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Stage
            title="To Contact"
            stage="to_contact"
            items={rows.to_contact}
            currentUserId={currentUserId}
          />
          <Stage
            title="Discussion"
            stage="discussion"
            items={rows.discussion}
            currentUserId={currentUserId}
          />
          <Stage
            title="Closed"
            stage="closed"
            items={rows.closed}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Stage column ─────────────────── */

function Stage({ title, stage, items, currentUserId }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No deals here yet.
          </div>
        ) : (
          items.map((p) => (
            <PipelineRow
              key={p.id}
              p={p}
              stage={stage}
              currentUserId={currentUserId}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

/* ─────────────────── Pipeline row (header + chat) ─────────────────── */

function PipelineRow({ p, stage, currentUserId }) {
  const [unlocked, setUnlocked] = useState(!!p.unlocked);

  const next =
    stage === 'to_contact'
      ? 'discussion'
      : stage === 'discussion'
      ? 'closed'
      : 'to_contact';

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 overflow-hidden">
      {/* compact header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/70">
        <div className="text-xs">
          <div className="flex items-center gap-2 font-medium text-sm">
            <span className="truncate max-w-[160px]">
              {p.investor?.name || 'Unknown investor'}
            </span>
            {unlocked && (
              <span className="text-[10px] rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                Unlocked
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            {new Date(p.created_at).toLocaleDateString()}
          </div>
        </div>

        <form action={updatePipelineStageAction} className="shrink-0">
          <input type="hidden" name="pipeline_id" value={p.id} />
          <input type="hidden" name="stage" value={next} />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs whitespace-nowrap"
          >
            Move → {next}
          </Button>
        </form>
      </div>

      {/* body: chat only in Discussion stage */}
      {stage === 'discussion' && currentUserId && (
        <div className="px-2 pb-2 pt-1">
          <ChatBox
            pipelineId={p.id}
            currentUserId={currentUserId}
            initiallyUnlocked={unlocked}
            onUnlocked={() => setUnlocked(true)}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────── ChatBox with credit unlock ─────────────────── */
/**
 * Requires:
 * - table public.unlocked_pipeline_chats(user_id, pipeline_id, ...)
 * - function public.unlock_pipeline_chat(p_pipeline_id uuid)
 */

function ChatBox({
  pipelineId,
  currentUserId,
  initiallyUnlocked = false,
  onUnlocked,
}) {
  const [unlocked, setUnlocked] = useState(initiallyUnlocked);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Load existing messages + subscribe to realtime (only if unlocked)
  useEffect(() => {
    if (!unlocked) return;

    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from('pipeline_messages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: true });

      if (!cancelled) {
        if (error) {
          console.error('loadMessages error:', error);
          setMessages([]);
        } else {
          setMessages(data || []);
        }
        setLoading(false);
      }
    }

    loadMessages();

    const channel = supabase
      .channel(`pipeline_messages_${pipelineId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pipeline_messages',
          filter: `pipeline_id=eq.${pipelineId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pipeline_messages',
          filter: `pipeline_id=eq.${pipelineId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? payload.new : m))
          );
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [pipelineId, unlocked]);

  /* ── Unlock with credits ── */

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

      const { data, error } = await supabase.rpc('unlock_pipeline_chat', {
        p_pipeline_id: pipelineId,
      });

      if (error) {
        console.error('unlock_pipeline_chat error:', error);
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
      if (onUnlocked) onUnlocked();
    } catch (e) {
      console.error(e);
      setUnlockError(e.message || 'Failed to unlock chat.');
    } finally {
      setUnlocking(false);
    }
  }

  /* ── Sending / files (only when unlocked) ── */

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || !unlocked) return;
    setSending(true);

    const { error } = await supabase.from('pipeline_messages').insert({
      pipeline_id: pipelineId,
      sender_id: currentUserId,
      content: trimmed,
    });

    if (error) {
      console.error('sendMessage error:', error);
      alert('Failed to send message: ' + error.message);
    } else {
      setNewMessage('');
    }

    setSending(false);
  }

  async function handleFileChange(e) {
    if (!unlocked) {
      e.target.value = '';
      return;
    }

    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    const bucket = 'chat-doc';

    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const path = `${pipelineId}/${Date.now()}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file);

        if (uploadError) {
          console.error('upload error:', uploadError);
          alert('Failed to upload file: ' + uploadError.message);
          continue;
        }

        const { data: publicData, error: publicUrlError } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);

        if (publicUrlError) {
          console.error('getPublicUrl error:', publicUrlError);
          alert('Failed to get file URL: ' + publicUrlError.message);
          continue;
        }

        const publicUrl = publicData.publicUrl;

        const { error: insertError } = await supabase
          .from('pipeline_messages')
          .insert({
            pipeline_id: pipelineId,
            sender_id: currentUserId,
            content: '',
            file_url: publicUrl,
            file_name: file.name,
            file_type: file.type,
          });

        if (insertError) {
          console.error('insert file message error:', insertError);
          alert('Failed to create file message: ' + insertError.message);
          continue;
        }
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function togglePin(message) {
    const { id, is_pinned } = message;

    const { error } = await supabase
      .from('pipeline_messages')
      .update({ is_pinned: !is_pinned })
      .eq('id', id);

    if (error) {
      console.error('pin toggle error:', error);
      alert('Failed to toggle pin: ' + error.message);
    }
  }

  const pinnedMessages = messages.filter((m) => m.is_pinned);
  const normalMessages = messages.filter((m) => !m.is_pinned);

  /* ── Locked state UI ── */

  if (!unlocked) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-300 mb-1">
          Chat with investor
        </div>
        <div className="flex items-center justify-between rounded-md border border-emerald-600/70 bg-emerald-950/40 px-3 py-2">
          <div className="text-[11px] text-emerald-100 mr-3">
            Unlock this private chat to send and view messages. Cost:{' '}
            <span className="font-semibold">1 credit</span>.
          </div>
          <Button
            size="sm"
            onClick={handleUnlock}
            disabled={unlocking}
            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-xs"
          >
            <Lock className="w-3 h-3 mr-1" />
            {unlocking ? 'Unlocking…' : 'Unlock chat'}
          </Button>
        </div>
        {unlockError && (
          <p className="text-[11px] text-red-400">{unlockError}</p>
        )}
      </div>
    );
  }

  /* ── Unlocked chat UI ── */

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-300 mb-1">
        Chat with investor
      </div>

      {/* Pinned messages bar */}
      {pinnedMessages.length > 0 && (
        <div className="border border-yellow-600/60 bg-yellow-950/40 rounded p-2 mb-2 space-y-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-yellow-300 uppercase tracking-wide">
            <Pin className="w-3 h-3" />
            Pinned
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {pinnedMessages.map((m) => (
              <div
                key={m.id}
                className="text-xs text-yellow-100/90 flex justify-between gap-2"
              >
                <div className="truncate">
                  {m.file_name ? (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline truncate"
                      >
                        {m.file_name}
                      </a>
                    </span>
                  ) : (
                    m.content || '[no text]'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => togglePin(m)}
                  className="text-[10px] opacity-80 hover:opacity-100"
                >
                  Unpin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages list */}
      <div className="max-h-64 overflow-y-auto space-y-1 text-sm border border-slate-800 rounded p-2 bg-slate-950/60">
        {loading ? (
          <div className="text-xs text-slate-500">Loading chat…</div>
        ) : normalMessages.length === 0 ? (
          <div className="text-xs text-slate-500">
            No messages yet. Say hi 👋
          </div>
        ) : (
          normalMessages.map((m) => {
            const isMe = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative group max-w-[80%] px-2 py-1 rounded-lg text-xs shadow-sm ${
                    isMe
                      ? 'bg-emerald-600 text-emerald-50'
                      : 'bg-slate-800 text-slate-50'
                  }`}
                >
                  {m.file_url && (
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 mb-0.5 underline"
                    >
                      <FileText className="w-3 h-3" />
                      <span className="truncate">{m.file_name}</span>
                    </a>
                  )}

                  {m.content && <div>{m.content}</div>}

                  <div className="flex items-center justify-between mt-0.5">
                    <div className="text-[10px] opacity-80">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePin(m)}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] flex items-center gap-1"
                    >
                      {m.is_pinned ? (
                        <>
                          <PinOff className="w-3 h-3" /> Unpin
                        </>
                      ) : (
                        <>
                          <Pin className="w-3 h-3" /> Pin
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <form onSubmit={handleSend} className="flex items-center gap-2 mt-1">
        <label className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-700 bg-slate-900 hover:bg-slate-800 cursor-pointer text-slate-200">
          <Paperclip className="w-4 h-4" />
          <input
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
        </label>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 rounded-full border border-slate-700 px-3 py-2 text-sm bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Type a message…"
        />

        <Button
          type="submit"
          size="sm"
          disabled={sending || !newMessage.trim()}
          className="rounded-full bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? '...' : 'Send'}
        </Button>
      </form>

      {uploading && (
        <div className="text-[11px] text-slate-400">Uploading document…</div>
      )}
    </div>
  );
}
