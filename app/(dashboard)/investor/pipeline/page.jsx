// app/(dashboard)/investor/pipeline/page.jsx
'use client';

import { useEffect, useState, useRef } from 'react';
import supabase from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updatePipelineStageAction } from '@/app/actions/startups';
import { Paperclip, Pin, PinOff, FileText } from 'lucide-react';

export default function InvestorPipeline() {
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

        // 1) Who is the logged-in investor?
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

        // 2) All pipeline rows where THIS investor is the investor
        const {
          data: pipelineRows,
          error: pipelineError,
        } = await supabase
          .from('investor_pipeline')
          .select('id, stage, created_at, investor_id, startup_id')
          .eq('investor_id', user.id)
          .order('created_at', { ascending: false });

        if (pipelineError) throw pipelineError;

        let enriched = pipelineRows || [];

        // 3) Look up startup (founder) names from profiles
        if (enriched.length) {
          const startupIds = Array.from(
            new Set(enriched.map((r) => r.startup_id).filter(Boolean))
          );

          let startupsById = {};
          if (startupIds.length) {
            const { data: profs, error: profErr } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', startupIds);

            if (profErr) {
              console.error('profiles lookup error:', profErr);
            } else {
              startupsById = Object.fromEntries(
                (profs || []).map((p) => [p.id, p.full_name || ''])
              );
            }
          }

          enriched = enriched.map((r) => ({
            ...r,
            startup: {
              id: r.startup_id,
              name: startupsById[r.startup_id] || 'Unknown startup',
            },
          }));
        }

        if (cancel) return;

        // 4) Group by stage
        const grouped = { to_contact: [], discussion: [], closed: [] };
        for (const r of enriched) {
          if (grouped[r.stage]) grouped[r.stage].push(r);
        }

        setRows(grouped);
      } catch (err) {
        console.error('Investor pipeline load error:', err);
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
      <h1 className="text-3xl font-bold">My Pipeline (Investor)</h1>

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

function PipelineRow({ p, stage, currentUserId }) {
  const next =
    stage === 'to_contact'
      ? 'discussion'
      : stage === 'discussion'
      ? 'closed'
      : 'to_contact';

  return (
    <div className="flex flex-col gap-2 border rounded px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {/* show startup/founder name for the investor */}
          <div className="font-medium">{p.startup?.name || '—'}</div>
          <div className="text-muted-foreground">
            {new Date(p.created_at).toLocaleDateString()}
          </div>
        </div>

        <form action={updatePipelineStageAction}>
          <input type="hidden" name="pipeline_id" value={p.id} />
          <input type="hidden" name="stage" value={next} />
          <Button type="submit" size="sm" variant="outline">
            Move → {next}
          </Button>
        </form>
      </div>

      {stage === 'discussion' && currentUserId && (
        <ChatBox pipelineId={p.id} currentUserId={currentUserId} />
      )}
    </div>
  );
}

// ChatBox for investor side – same features as founder side
function ChatBox({ pipelineId, currentUserId }) {
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

  // Load existing messages + subscribe to realtime
  useEffect(() => {
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
  }, [pipelineId]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed) return;
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
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    const bucket = 'chat-doc'; // same bucket as founder side

    try {
      for (const file of files) {
        // sanitize filename for storage key
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const path = `${pipelineId}/${Date.now()}_${safeName}`;

        // 1) Upload file
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file);

        if (uploadError) {
          console.error('upload error:', uploadError);
          alert('Failed to upload file: ' + uploadError.message);
          continue;
        }

        // 2) Get public URL
        const { data: publicData, error: publicUrlError } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);

        if (publicUrlError) {
          console.error('getPublicUrl error:', publicUrlError);
          alert('Failed to get file URL: ' + publicUrlError.message);
          continue;
        }

        const publicUrl = publicData.publicUrl;

        // 3) Insert file message row
        const { error: insertError } = await supabase
          .from('pipeline_messages')
          .insert({
            pipeline_id: pipelineId,
            sender_id: currentUserId,
            content: '',
            file_url: publicUrl,
            file_name: file.name, // original name for display
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

  return (
    <div className="mt-2 border rounded p-2 space-y-2 bg-slate-950 border-slate-800">
      <div className="text-xs font-semibold text-slate-300 mb-1">
        Chat with founder
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
                  {/* File link if any */}
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

                  {/* Text content */}
                  {m.content && <div>{m.content}</div>}

                  {/* Time + pin button */}
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

      {/* Input row with file upload + send */}
      <form onSubmit={handleSend} className="flex items-center gap-2 mt-1">
        {/* File upload */}
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
