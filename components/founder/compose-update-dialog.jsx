// components/founder/compose-update-dialog.jsx
'use client'

import { useEffect, useState } from 'react'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Send } from 'lucide-react'

export function ComposeUpdateDialog({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [investors, setInvestors] = useState([])
  const [investorsLoading, setInvestorsLoading] = useState(false)
  const [selectedInvestorIds, setSelectedInvestorIds] = useState([])

  const [form, setForm] = useState({
    subject: '',
    body: '',
    status: 'sent', // or 'draft'
  })

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  // Load investors from `investors` table when dialog opens
  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadInvestors() {
      try {
        setInvestorsLoading(true)

        // no need to filter by founder for now – just show all investors
        const { data, error } = await supabase
          .from('investors')
          .select('user_id, investor_type, sectors')

        console.log('INVESTORS for dialog:', { data, error })
        if (error) throw error

        if (!cancelled) setInvestors(data || [])
      } catch (err) {
        console.error('Error loading investors for dialog:', err)
        if (!cancelled) setInvestors([])
      } finally {
        if (!cancelled) setInvestorsLoading(false)
      }
    }

    loadInvestors()
    return () => {
      cancelled = true
    }
  }, [open])

  const toggleInvestor = (id) => {
    setSelectedInvestorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSaving(true)

      // 🔴 IMPORTANT: get current user & use as founder_id
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('You must be logged in to send an update.')

      // 1) create the update row with founder_id set
      const { data: updateRow, error: updateError } = await supabase
        .from('investor_updates')
        .insert([
          {
            subject: form.subject,
            body: form.body,
            status: form.status,   // 'sent' | 'draft'
            founder_id: user.id,   // 👈 this must match your RLS policy
          },
        ])
        .select()
        .single()

      if (updateError) throw updateError

      // 2) create recipient rows
      if (selectedInvestorIds.length > 0) {
        const rows = selectedInvestorIds.map((invId) => ({
          update_id: updateRow.id,
          investor_id: invId, // references investors.user_id
        }))

        const { error: recError } = await supabase
          .from('investor_update_recipients')
          .insert(rows)

        if (recError) throw recError
      }

      const mapped = {
        id: updateRow.id,
        subject: updateRow.subject,
        body: updateRow.body,
        status: updateRow.status || 'sent',
        createdAt: updateRow.created_at
          ? new Date(updateRow.created_at)
          : new Date(),
        recipientsCount: selectedInvestorIds.length,
      }

      if (onCreated) onCreated(mapped)

      // reset + close
      setForm({ subject: '', body: '', status: 'sent' })
      setSelectedInvestorIds([])
      setOpen(false)
    } catch (err) {
      console.error('Error creating investor update:', err)
      alert(err.message || 'Failed to create update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="mr-2 h-4 w-4" />
          New Update
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compose Investor Update</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <Input
              value={form.subject}
              onChange={handleChange('subject')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Body</label>
            <Textarea
              value={form.body}
              onChange={handleChange('body')}
              rows={5}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Recipients (investors)
            </label>

            {investorsLoading ? (
              <p className="text-xs text-muted-foreground">
                Loading investors...
              </p>
            ) : investors.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No investors found. Add investors first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {investors.map((inv) => {
                  const id = inv.user_id
                  const label =
                    inv.investor_type ||
                    inv.sectors ||
                    (inv.user_id ? inv.user_id.slice(0, 8) : 'Investor')

                  const selected = selectedInvestorIds.includes(id)

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleInvestor(id)}
                      className={`px-2 py-1 rounded-full text-xs border ${
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
