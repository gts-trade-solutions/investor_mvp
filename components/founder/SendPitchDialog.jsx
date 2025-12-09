'use client';

import { useState, useRef } from 'react';
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
import { toast } from 'sonner';

export default function SendPitchDialog({
  triggerButton,
  preselectedInvestors = [],     // just for display (names)
  preselectedInvestorIds = [],   // REAL ids that API expects
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);      // ⬅️ selected PDF
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  async function onSend() {
    try {
      setLoading(true);

      if (!subject.trim() || !message.trim()) {
        toast.error('Subject and message are required');
        setLoading(false);
        return;
      }

      const investorIds = preselectedInvestorIds;
      if (!investorIds.length) {
        toast.error('No investors specified');
        setLoading(false);
        return;
      }

      // Build multipart form data so we can send the PDF file
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      formData.append('investorIds', JSON.stringify(investorIds));
      if (file) {
        formData.append('deck', file); // "deck" field contains the PDF
      }

      const res = await fetch('/api/pitches', {
        method: 'POST',
        body: formData, // 🔥 no Content-Type header – browser sets it
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send');

      toast.success('Pitch sent to investors!');
      setOpen(false);
      setSubject('');
      setMessage('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      toast.error(e.message || 'Something went wrong');
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
            onChange={e => setSubject(e.target.value)}
          />

          <Textarea
            rows={8}
            placeholder="Introduce your startup, traction, and the ask…"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />

          {/* 👇 PDF "Choose file" upload */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Pitch deck (PDF, optional)</p>

            {/* hidden real input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
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
          <Button onClick={onSend} disabled={loading}>
            {loading ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
