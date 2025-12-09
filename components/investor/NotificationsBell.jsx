'use client'

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

/**
 * Props:
 * - triggerButton: the button you pass from the card
 * - defaultInvestorId: if present, we DON'T show investor dropdown, we use this id
 * - defaultInvestorName: (optional) to show a label "Sending to X"
 * - onSent: callback that will create the notification (in InvestorCard)
 */
export function SendPitchDialog({
  triggerButton,
  defaultInvestorId,
  defaultInvestorName,
  onSent,
}) {
  const [open, setOpen] = useState(false)
  const [investorId, setInvestorId] = useState(defaultInvestorId || '')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // keep local state in sync if defaultInvestorId changes
  useEffect(() => {
    if (defaultInvestorId) {
      setInvestorId(defaultInvestorId)
    }
  }, [defaultInvestorId])

  async function handleSubmit(e) {
    e.preventDefault()

    const finalInvestorId = defaultInvestorId || investorId

    if (!finalInvestorId) {
      alert('Investor is required.')
      return
    }

    try {
      setSubmitting(true)

      // 1) upload PDF if present
      let pdfUrl = null

      if (file) {
        const ext = file.name.split('.').pop() || 'pdf'
        const path = `pitch-decks/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`

        const { data, error } = await supabase.storage
          .from('pitch_decks') // <-- your bucket name
          .upload(path, file)

        if (error) throw error

        const { data: publicData } = supabase.storage
          .from('pitch_decks')
          .getPublicUrl(data.path)

        pdfUrl = publicData.publicUrl
      }

      // 2) hand off to parent (InvestorCard.handleSendPitch)
      if (onSent) {
        await onSent({
          investor_id: finalInvestorId,
          message,
          pdf_url: pdfUrl,
        })
      }

      // 3) reset & close
      setOpen(false)
      setMessage('')
      setFile(null)
    } catch (err) {
      console.error('Send pitch failed:', err)
      alert(err?.message || 'Failed to send pitch.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Send pitch</DialogTitle>
            <DialogDescription>
              Write a short note and optionally attach your pitch deck as a PDF.
            </DialogDescription>
          </DialogHeader>

          {/* If we have defaultInvestorId (from card), just show info text, no dropdown */}
          {defaultInvestorId ? (
            <div className="space-y-1">
              <Label>Sending to</Label>
              <p className="text-sm font-medium">
                {defaultInvestorName || 'Selected investor'}
              </p>
            </div>
          ) : (
            // Fallback mode: simple text input for investor id (only if you ever use dialog without a card)
            <div className="space-y-2">
              <Label htmlFor="investor-id">Investor ID</Label>
              <Input
                id="investor-id"
                value={investorId}
                onChange={(e) => setInvestorId(e.target.value)}
                placeholder="Investor id / email"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, here’s a quick overview of what we’re building…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deck">Pitch deck (PDF, optional)</Label>
            <Input
              id="deck"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send pitch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
