// app/founder/updates/page.jsx
'use client'

import React, { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Archive, Edit, MessageCircle, Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ComposeUpdateDialog } from '@/components/founder/compose-update-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

function getStatusBadge(status) {
  switch (status) {
    case 'sent':
      return <Badge variant="default">Sent</Badge>
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>
    case 'archived':
      return <Badge variant="outline">Archived</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

export default function FounderUpdatesPage() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  // View dialog state
  const [viewUpdate, setViewUpdate] = useState(null)

  // Edit dialog state
  const [editUpdate, setEditUpdate] = useState(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  /* ───────── Load updates ───────── */
  useEffect(() => {
    let cancelled = false

    async function loadUpdates() {
      try {
        setLoading(true)

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        console.log('auth.getUser result:', { user, authError })
        if (authError) throw authError
        if (!user) {
          window.location.href = '/auth/signin'
          return
        }

        // Rely on RLS to only show the founder's own rows
        const { data, error } = await supabase
          .from('investor_updates')
          .select(
            `
            id,
            subject,
            body,
            status,
            created_at,
            investor_update_recipients ( id )
          `
          )
          .order('created_at', { ascending: false })

        console.log('select investor_updates result:', { data, error })
        if (error) throw error

        if (!cancelled) {
          const mapped = (data || []).map((row) => ({
            id: row.id,
            subject: row.subject,
            body: row.body,
            status: row.status || 'sent',
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            recipientsCount: Array.isArray(row.investor_update_recipients)
              ? row.investor_update_recipients.length
              : 0,
          }))
          setUpdates(mapped)
        }
      } catch (err) {
        console.error('Error loading investor updates:', err)
        if (!cancelled) setUpdates([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUpdates()
    return () => {
      cancelled = true
    }
  }, [])

  /* ───────── Archive ───────── */

  const handleArchive = async (update) => {
    try {
      const { error } = await supabase
        .from('investor_updates')
        .update({ status: 'archived' })
        .eq('id', update.id)

      if (error) throw error

      setUpdates((prev) =>
        prev.map((u) =>
          u.id === update.id ? { ...u, status: 'archived' } : u
        )
      )
    } catch (err) {
      console.error('Error archiving update:', err)
      alert('Failed to archive update')
    }
  }

  /* ───────── View details ───────── */

  const handleViewDetails = (update) => {
    setViewUpdate(update)
  }

  /* ───────── Edit draft ───────── */

  const handleEdit = (update) => {
    if (update.status !== 'draft') return
    setEditUpdate(update)
    setEditSubject(update.subject || '')
    setEditBody(update.body || '')
  }

  const handleEditSave = async (e) => {
    e.preventDefault()
    if (!editUpdate) return

    try {
      setSavingEdit(true)

      const { data, error } = await supabase
        .from('investor_updates')
        .update({
          subject: editSubject.trim(),
          body: editBody.trim(),
        })
        .eq('id', editUpdate.id)
        .select(
          `
          id,
          subject,
          body,
          status,
          created_at,
          investor_update_recipients ( id )
        `
        )
        .single()

      if (error) throw error

      // Update local state with the fresh row from DB
      setUpdates((prev) =>
        prev.map((u) =>
          u.id === data.id
            ? {
                id: data.id,
                subject: data.subject,
                body: data.body,
                status: data.status || 'sent',
                createdAt: data.created_at
                  ? new Date(data.created_at)
                  : new Date(),
                recipientsCount: Array.isArray(
                  data.investor_update_recipients
                )
                  ? data.investor_update_recipients.length
                  : u.recipientsCount ?? 0,
              }
            : u
        )
      )

      setEditUpdate(null)
      setEditSubject('')
      setEditBody('')
    } catch (err) {
      console.error('Error saving update edit:', err)
      alert(err.message || 'Failed to save changes')
    } finally {
      setSavingEdit(false)
    }
  }

  /* ───────── Render ───────── */

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investor Updates</h1>
          <p className="text-muted-foreground">Loading updates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investor Updates</h1>
          <p className="text-muted-foreground">
            Keep your investors informed with regular updates
          </p>
        </div>

        <ComposeUpdateDialog
          onCreated={(newUpdate) =>
            setUpdates((prev) => [newUpdate, ...prev])
          }
        />
      </div>

      {/* List */}
      <div className="space-y-4">
        {updates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No investor updates yet.
              </p>
              <ComposeUpdateDialog
                onCreated={(newUpdate) =>
                  setUpdates((prev) => [newUpdate, ...prev])
                }
              />
            </CardContent>
          </Card>
        ) : (
          updates.map((update) => (
            <Card
              key={update.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {update.subject}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(update.createdAt)}
                      {update.recipientsCount > 0 && (
                        <>
                          {' • Sent to '}
                          {update.recipientsCount} investors
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(update.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={update.status !== 'draft'}
                      title={
                        update.status === 'draft'
                          ? 'Edit update'
                          : 'Only drafts can be edited'
                      }
                      onClick={() => handleEdit(update)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2 mb-4">
                  {update.body}
                </p>
                <div className="flex items-center space-x-2">
                  {update.status === 'draft' ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          alert('Send draft logic not implemented')
                        }
                      >
                        <Send className="mr-2 h-3 w-3" />
                        Send Update
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(update)}
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(update)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArchive(update)}
                        disabled={update.status === 'archived'}
                      >
                        <Archive className="mr-2 h-3 w-3" />
                        {update.status === 'archived'
                          ? 'Archived'
                          : 'Archive'}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Details dialog */}
      <Dialog
        open={!!viewUpdate}
        onOpenChange={(open) => {
          if (!open) setViewUpdate(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewUpdate?.subject || 'Investor Update'}
            </DialogTitle>
            <DialogDescription>
              {viewUpdate
                ? `${formatDate(viewUpdate.createdAt)} • ${
                    viewUpdate.recipientsCount || 0
                  } recipient${
                    viewUpdate.recipientsCount === 1 ? '' : 's'
                  }`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            <div className="text-xs">
              <span className="font-semibold mr-1">Status:</span>
              {viewUpdate && getStatusBadge(viewUpdate.status)}
            </div>
            <div className="border rounded-md p-3 bg-muted/40 max-h-72 overflow-y-auto text-sm whitespace-pre-wrap">
              {viewUpdate?.body}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUpdate(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog (for drafts) */}
      <Dialog
        open={!!editUpdate}
        onOpenChange={(open) => {
          if (!open) {
            setEditUpdate(null)
            setEditSubject('')
            setEditBody('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Investor Update</DialogTitle>
            <DialogDescription>
              Only drafts can be edited. Changes will be saved
              immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div>
              <Label htmlFor="edit-subject">Subject</Label>
              <Input
                id="edit-subject"
                className="mt-1"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-body">Body</Label>
              <Textarea
                id="edit-body"
                className="mt-1"
                rows={6}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditUpdate(null)
                  setEditSubject('')
                  setEditBody('')
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
