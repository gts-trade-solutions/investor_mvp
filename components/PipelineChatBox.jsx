'use client';

import { useEffect, useState, useRef } from 'react';
import supabase from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

export default function PipelineChatBox({ pipelineId, currentUserId, heading }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // ---- helpers ----
  function makeSafeFileName(originalName) {
    const dotIndex = originalName.lastIndexOf('.');
    const base = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
    const ext = dotIndex !== -1 ? originalName.slice(dotIndex + 1) : '';
    const safeBase = base.replace(/[^a-zA-Z0-9-_]+/g, '_'); // only letters, numbers, - _
    return ext ? `${safeBase}.${ext}` : safeBase;
  }

  // ---- load + realtime ----
  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from('pipeline_messages')
        .select(
          'id, sender_id, content, created_at, is_pinned, attachment_path, attachment_name, attachment_type'
        )
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: true });

      if (!cancelled) {
        if (error) {
          console.error('loadMessages error:', error);
        } else {
          setMessages(data || []);
        }
        setLoading(false);
      }
    }

    loadMessages();

    // realtime
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

  // ---- send text only ----
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
    } else {
      setNewMessage('');
    }

    setSending(false);
  }

  // ---- file upload as message ----
  function triggerFileSelect() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    try {
      setUploading(true);

      const safeName = makeSafeFileName(file.name);
      const path = `${pipelineId}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('pipeline-files')             // 👈 create this bucket
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('attachment upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      const { error: insertError } = await supabase.from('pipeline_messages').insert({
        pipeline_id: pipelineId,
        sender_id: currentUserId,
        content: newMessage.trim() || '📎 Sent an attachment',
        attachment_path: path,
        attachment_name: file.name,
        attachment_type: file.type,
      });

      if (insertError) {
        console.error('attachment message insert error:', insertError);
        throw new Error(insertError.message);
      }

      setNewMessage('');
    } catch (err) {
      console.error('handleFileChange error:', err);
      alert('Failed to upload attachment.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ---- open attachment ----
  async function handleOpenAttachment(message) {
    try {
      if (!message.attachment_path) return;

      const { data, error } = await supabase.storage
        .from('pipeline-files')
        .createSignedUrl(message.attachment_path, 60);

      if (error || !data?.signedUrl) {
        console.error('open attachment error:', error);
        alert('Could not open attachment.');
        return;
      }

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('handleOpenAttachment error:', err);
      alert('Could not open attachment.');
    }
  }

  // ---- pin / unpin ----
  async function handleTogglePin(message) {
    try {
      const { error } = await supabase
        .from('pipeline_messages')
        .update({ is_pinned: !message.is_pinned })
        .eq('id', message.id);

      if (error) {
        console.error('toggle pin error:', error);
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, is_pinned: !m.is_pinned } : m
        )
      );
    } catch (err) {
      console.error('handleTogglePin error:', err);
    }
  }

  const pinnedMessages = messages.filter((m) => m.is_pinned);
  const normalMessages = messages.filter((m) => !m.is_pinned);

  return (
    <div className="mt-2 border rounded p-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-muted-foreground">
          {heading || 'Chat'}
        </div>
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={triggerFileSelect}
          disabled={uploading}
          className="h-6 px-2 text-[10px]"
        >
          {uploading ? 'Uploading…' : 'Attach'}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="max-h-64 overflow-y-auto space-y-2 text-sm border rounded p-2 bg-background">
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading chat…</div>
        ) : messages.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            No messages yet. Say hi 👋
          </div>
        ) : (
          <>
            {pinnedMessages.length > 0 && (
              <div className="mb-2 border-b pb-2">
                <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                  Pinned
                </div>
                {pinnedMessages.map((m) => {
                  const isMe = m.sender_id === currentUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="px-2 py-1 rounded text-xs bg-yellow-100 dark:bg-yellow-900/40">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[10px]">📌 Pinned</span>
                          <button
                            type="button"
                            onClick={() => handleTogglePin(m)}
                            className="text-[10px] underline"
                          >
                            Unpin
                          </button>
                        </div>
                        <div>{m.content}</div>
                        {m.attachment_name && (
                          <button
                            type="button"
                            onClick={() => handleOpenAttachment(m)}
                            className="mt-1 text-[10px] underline"
                          >
                            📎 {m.attachment_name}
                          </button>
                        )}
                        <div className="text-[10px] opacity-70 mt-0.5">
                          {new Date(m.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {normalMessages.map((m) => {
              const isMe = m.sender_id === currentUserId;
              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`px-2 py-1 rounded text-xs ${
                      isMe
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>{m.content}</div>
                      <button
                        type="button"
                        onClick={() => handleTogglePin(m)}
                        className="text-[10px] underline"
                      >
                        {m.is_pinned ? 'Unpin' : 'Pin'}
                      </button>
                    </div>
                    {m.attachment_name && (
                      <button
                        type="button"
                        onClick={() => handleOpenAttachment(m)}
                        className="mt-1 text-[10px] underline"
                      >
                        📎 {m.attachment_name}
                      </button>
                    )}
                    <div className="text-[10px] opacity-70 mt-0.5">
                      {new Date(m.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 rounded border px-2 py-1 text-sm bg-background text-foreground"
          placeholder="Type a message…"
        />
        <Button
          type="submit"
          size="sm"
          disabled={sending || !newMessage.trim()}
        >
          Send
        </Button>
      </form>
    </div>
  );
}
