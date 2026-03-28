// components/founder/send-pitch-dialog.jsx
'use client';

import { useState } from 'react';
import supabase from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function SendPitchDialog({
  triggerButton,
  preselectedInvestors = [],     // just for display (names)
  preselectedInvestorIds = [],   // MUST be auth.users.id of investors
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSend() {
    try {
      setLoading(true);

      // 1) basic validation
      if (!subject.trim() || !message.trim()) {
        alert('Subject and message are required');
        return;
      }

      if (!preselectedInvestorIds.length) {
        alert('No investors specified');
        return;
      }

      // 2) who is sending? (founder)
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) {
        window.location.href = '/auth/signin';
        return;
      }

      // 3) Upload PDF (optional)
      let deckUrl = null;

      if (file) {
        const ext = file.name.split('.').pop() || 'pdf';
        const path = `pitch-decks/${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { data, error } = await supabase.storage
          .from('pitch_decks') // your bucket name
          .upload(path, file);

        if (error) {
          console.error('Upload error:', error);
          throw new Error(error.message || 'Failed to upload deck');
        }

        const { data: publicData } = supabase.storage
          .from('pitch_decks')
          .getPublicUrl(data.path);

        deckUrl = publicData.publicUrl;
      }

      // 4) Create notifications directly (this is what drives the investor's bell)
      const rows = preselectedInvestorIds.map((investorId) => ({
        recipient_user_id: investorId,               // investor gets this
        title: subject || 'New pitch received',
        body: message,
        type: 'INVESTOR_PITCH',                      // same type you already use
        data: deckUrl ? { pdf_url: deckUrl } : null, // /notifications uses data.pdf_url
        is_read: false,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(rows);

      if (notifError) {
        console.error('Notification insert error:', notifError);
        throw new Error(notifError.message || 'Failed to create notification');
      }

      alert('Pitch sent to investors!');
      setOpen(false);
      setSubject('');
      setMessage('');
      setFile(null);
    } catch (e) {
      console.error('Send pitch failed:', e);
      alert(e.message || 'Something went wrong while sending the pitch');
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

        {!!preselectedInvestors.length && (
          <div className="text-sm text-muted-foreground">
            To:&nbsp;
            <span className="font-medium">
              {preselectedInvestors.join(', ')}
            </span>
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

          <div className="space-y-1">
            <p className="text-sm font-medium">Pitch deck (PDF, optional)</p>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              {file ? file.name : 'No file chosen'}
            </p>
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
          <Button onClick={onSend} disabled={loading}>
            {loading ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
