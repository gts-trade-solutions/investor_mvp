'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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
import {
  Plus,
  FileText,
  Eye,
  Download,
  Share,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  X,
  Send,
  Search,
} from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/utils'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function PitchDecks() {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

  const [editOpen, setEditOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [activeDeck, setActiveDeck] = useState(null)

  const fileInputRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw authError
        if (!user) {
          window.location.href = '/auth/signin'
          return
        }

        setCurrentUserId(user.id)

        const { data, error } = await supabase
          .from('pitch_decks')
          .select(
            'id, user_id, name, file_path, size_bytes, views, downloads, mime_type, created_at'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (!cancelled) {
          setDecks((data || []).map(mapRowToDeck))
        }
      } catch (err) {
        console.error('Error loading pitch decks:', err)
        if (!cancelled) setDecks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  function mapRowToDeck(row) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      filePath: row.file_path,
      sizeBytes: row.size_bytes,
      size: formatFileSize(row.size_bytes),
      views: row.views || 0,
      downloads: row.downloads || 0,
      type: row.mime_type || 'application/pdf',
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    }
  }

  function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return '—'
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb.toFixed(1)} MB`
    const gb = mb / 1024
    return `${gb.toFixed(1)} GB`
  }

  function makeSafeFileName(originalName) {
    const dotIndex = originalName.lastIndexOf('.')
    const base = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName
    const ext = dotIndex !== -1 ? originalName.slice(dotIndex + 1) : ''
    const safeBase = base.replace(/[^a-zA-Z0-9-_]+/g, '_')
    if (!ext) return safeBase
    return `${safeBase}.${ext}`
  }

  /* ───────────────── Upload new deck ───────────────── */

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || !currentUserId) return

    try {
      setUploading(true)

      const safeName = makeSafeFileName(file.name)
      const ext = safeName.split('.').pop()
      const path = `${currentUserId}/${Date.now()}_${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('pitch-deck')
        .upload(path, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

      const { data: inserted, error: insertError } = await supabase
        .from('pitch_decks')
        .insert({
          user_id: currentUserId,
          name: file.name,
          file_path: path,
          size_bytes: file.size,
          views: 0,
          downloads: 0,
          mime_type: file.type || `application/${ext || 'octet-stream'}`,
        })
        .select('id, user_id, name, file_path, size_bytes, views, downloads, mime_type, created_at')
        .single()

      if (insertError) throw new Error(`Database insert failed: ${insertError.message}`)

      setDecks((prev) => [mapRowToDeck(inserted), ...prev])
    } catch (err) {
      console.error('Upload deck error:', err)
      alert(err?.message || 'Failed to upload deck.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function triggerFileSelect() {
    fileInputRef.current?.click()
  }

  /* ───────────────── View / Download / Share link ───────────────── */

  async function getSignedUrl(filePath, seconds) {
    const { data, error } = await supabase.storage
      .from('pitch-deck')
      .createSignedUrl(filePath, seconds)

    if (error || !data?.signedUrl) throw new Error('Failed to create signed URL')
    return data.signedUrl
  }

  async function handleView(deck) {
    try {
      if (!deck.filePath) return alert('File path missing.')
      const url = await getSignedUrl(deck.filePath, 60)

      supabase
        .from('pitch_decks')
        .update({ views: (deck.views || 0) + 1 })
        .eq('id', deck.id)
        .then(() => {
          setDecks((prev) =>
            prev.map((d) => (d.id === deck.id ? { ...d, views: d.views + 1 } : d))
          )
        })

      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('View deck error:', err)
      alert(err?.message || 'Failed to open deck.')
    }
  }

  async function handleDownload(deck) {
    try {
      if (!deck.filePath) return alert('File path missing.')
      const url = await getSignedUrl(deck.filePath, 60)

      supabase
        .from('pitch_decks')
        .update({ downloads: (deck.downloads || 0) + 1 })
        .eq('id', deck.id)
        .then(() => {
          setDecks((prev) =>
            prev.map((d) =>
              d.id === deck.id ? { ...d, downloads: d.downloads + 1 } : d
            )
          )
        })

      window.open(url, '_self')
    } catch (err) {
      console.error('Download deck error:', err)
      alert(err?.message || 'Failed to download deck.')
    }
  }

  async function handleShareLink(deck) {
    try {
      if (!deck.filePath) return alert('File path missing.')
      const url = await getSignedUrl(deck.filePath, 60 * 60 * 24 * 7)

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        alert('Share link copied to clipboard.')
      } else {
        prompt('Copy this link:', url)
      }
    } catch (err) {
      console.error('Share link error:', err)
      alert(err?.message || 'Failed to create share link.')
    }
  }

  /* ───────────────── Edit name / Replace file / Delete ───────────────── */

  function openEdit(deck) {
    setActiveDeck(deck)
    setEditOpen(true)
  }

  function openShare(deck) {
    setActiveDeck(deck)
    setShareOpen(true)
  }

  async function handleRename(deckId, newName) {
    const name = (newName || '').trim()
    if (!name) return alert('Name required')

    const { error } = await supabase.from('pitch_decks').update({ name }).eq('id', deckId)
    if (error) throw error

    setDecks((prev) => prev.map((d) => (d.id === deckId ? { ...d, name } : d)))
  }

  async function handleReplaceFile(deck, newFile) {
    if (!deck?.filePath) throw new Error('File path missing on this deck')
    if (!newFile) return

    const { error: uploadError } = await supabase.storage
      .from('pitch-deck')
      .upload(deck.filePath, newFile, { cacheControl: '3600', upsert: true })

    if (uploadError) throw uploadError

    const { error: updErr } = await supabase
      .from('pitch_decks')
      .update({
        size_bytes: newFile.size,
        mime_type: newFile.type || 'application/pdf',
      })
      .eq('id', deck.id)

    if (updErr) throw updErr

    setDecks((prev) =>
      prev.map((d) =>
        d.id === deck.id
          ? {
              ...d,
              sizeBytes: newFile.size,
              size: formatFileSize(newFile.size),
              type: newFile.type || 'application/pdf',
            }
          : d
      )
    )
  }

  async function handleDelete(deck) {
    const ok = confirm(`Delete "${deck.name}"?\nThis will remove the file and cannot be undone.`)
    if (!ok) return

    if (deck.filePath) {
      const { error: storageErr } = await supabase.storage.from('pitch-deck').remove([deck.filePath])
      if (storageErr) {
        console.error('Storage remove error:', storageErr)
        alert('Failed to delete file from storage: ' + storageErr.message)
        return
      }
    }

    const { error: dbErr } = await supabase.from('pitch_decks').delete().eq('id', deck.id)
    if (dbErr) {
      console.error('DB delete error:', dbErr)
      alert('Failed to delete deck row: ' + dbErr.message)
      return
    }

    setDecks((prev) => prev.filter((d) => d.id !== deck.id))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pitch Decks</h1>
          <p className="text-muted-foreground">Loading pitch decks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pitch Decks</h1>
          <p className="text-muted-foreground">Manage your pitch decks and track engagement</p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={triggerFileSelect} disabled={uploading}>
            <Plus className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload Deck'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pitch decks uploaded yet.</p>
            <Button className="mt-4" onClick={triggerFileSelect} disabled={uploading}>
              <Plus className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading…' : 'Upload Your First Deck'}
            </Button>
          </div>
        ) : (
          decks.map((deck) => (
            <Card key={deck.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg line-clamp-1">{deck.name}</CardTitle>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {deck.type?.split('/')[1] || 'PDF'}
                        </Badge>
                      </div>
                      <CardDescription>{deck.size}</CardDescription>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(deck)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(deck)}>
                        <Download className="h-4 w-4 mr-2" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openShare(deck)}>
                        <Share className="h-4 w-4 mr-2" /> Share to investors
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareLink(deck)}>
                        <Share className="h-4 w-4 mr-2" /> Copy share link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openEdit(deck)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit / Replace
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(deck)}
                        className="text-red-400 focus:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => handleView(deck)}
                    className="flex items-center space-x-2 text-left hover:underline"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{formatNumber(deck.views)} views</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(deck)}
                    className="flex items-center space-x-2 text-left hover:underline"
                  >
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span>{formatNumber(deck.downloads)} downloads</span>
                  </button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Uploaded {formatDate(deck.createdAt)}
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1" type="button" onClick={() => handleView(deck)}>
                    <Eye className="mr-2 h-3 w-3" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" type="button" onClick={() => openShare(deck)}>
                    <Share className="mr-2 h-3 w-3" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <EditDeckDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        deck={activeDeck}
        onRename={handleRename}
        onReplace={handleReplaceFile}
      />

      <ShareToInvestorsDialog open={shareOpen} onOpenChange={setShareOpen} deck={activeDeck} />
    </div>
  )
}

/* ───────────────────────── Edit Deck Dialog ───────────────────────── */

function EditDeckDialog({ open, onOpenChange, deck, onRename, onReplace }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const replaceRef = useRef(null)

  useEffect(() => {
    setName(deck?.name || '')
  }, [deck?.id])

  async function saveName() {
    if (!deck?.id) return
    try {
      setSaving(true)
      await onRename(deck.id, name)
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      alert(e.message || 'Failed to rename')
    } finally {
      setSaving(false)
    }
  }

  async function onPickReplace(e) {
    const file = e.target.files?.[0]
    if (!file || !deck) return
    try {
      setReplacing(true)
      await onReplace(deck, file)
      alert('File replaced successfully')
    } catch (err) {
      console.error(err)
      alert(err?.message || 'Failed to replace file')
    } finally {
      setReplacing(false)
      e.target.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit / Replace</DialogTitle>
        </DialogHeader>

        {!deck ? (
          <div className="text-sm text-muted-foreground">No deck selected.</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Deck name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Deck name" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || replacing}>
                  Cancel
                </Button>
                <Button onClick={saveName} disabled={saving || replacing}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 p-3 space-y-2">
              <div className="text-sm font-medium">Replace PDF file</div>
              <div className="text-xs text-muted-foreground">
                Replaces the file in storage but keeps the same deck record.
              </div>

              <input ref={replaceRef} type="file" accept="application/pdf" className="hidden" onChange={onPickReplace} />

              <Button
                type="button"
                variant="outline"
                onClick={() => replaceRef.current?.click()}
                disabled={saving || replacing}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {replacing ? 'Replacing…' : 'Choose new PDF'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ───────────────────────── Share to Investors Dialog ───────────────────────── */

function ShareToInvestorsDialog({ open, onOpenChange, deck }) {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [investors, setInvestors] = useState([])
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function loadInvestors() {
      try {
        setLoading(true)

        // 1) Load investors from your existing API
        const res = await fetch('/api/investors', { cache: 'no-store' })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload?.error || 'Failed to load investors')

        const rows = payload?.investors || []

        // 2) Collect user ids (your investors table has user_id as TEXT)
        const userIds = Array.from(
          new Set(
            rows
              .map((inv) => inv.user_id ?? inv.owner ?? inv.userId ?? null)
              .filter(Boolean)
              .map(String)
          )
        )

        // 3) Fetch names from profiles (profiles.id is TEXT in your DB)
        let nameById = {}
        if (userIds.length) {
          const { data: profs, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds)

          if (profErr) {
            console.error('profiles lookup error:', profErr)
          } else {
            for (const p of profs || []) {
              nameById[String(p.id)] = (p.full_name || '').trim()
            }
          }
        }

        // 4) Normalize list with proper investor name
        const normalized = rows
          .map((inv) => {
            const userId = String(inv.user_id ?? inv.owner ?? inv.userId ?? '')
            if (!userId) return null

            const fullName = nameById[userId]
            const label =
              fullName ||
              inv.org_name ||
              inv.org?.name ||
              `Investor ${userId.slice(0, 8)}…`

            return { userId, label }
          })
          .filter(Boolean)

        if (!cancelled) setInvestors(normalized)
      } catch (e) {
        console.error(e)
        if (!cancelled) setInvestors([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setSelected(new Set())
    setMessage('')
    setQ('')
    loadInvestors()

    return () => {
      cancelled = true
    }
  }, [open])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return investors
    return investors.filter(
      (i) => i.label.toLowerCase().includes(s) || String(i.userId).toLowerCase().includes(s)
    )
  }, [investors, q])

  function toggleUser(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSend() {
    if (!deck?.filePath) return alert('Deck file path missing.')
    if (selected.size === 0) return alert('Select at least one investor.')

    try {
      setSending(true)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) {
        window.location.href = '/auth/signin'
        return
      }

      const sevenDays = 60 * 60 * 24 * 7
      const { data: signed, error: signedErr } = await supabase.storage
        .from('pitch-deck')
        .createSignedUrl(deck.filePath, sevenDays)

      if (signedErr || !signed?.signedUrl) throw new Error('Failed to create share URL')

      const recipients = Array.from(selected)

      // optional storage of shares (ignore errors if table doesn't exist)
      supabase
        .from('pitch_deck_shares')
        .insert(
          recipients.map((rid) => ({
            deck_id: deck.id,
            founder_id: user.id,
            investor_user_id: rid,
            message: message?.trim() || null,
          }))
        )
        .then(() => {})
        .catch(() => {})

      const notifRows = recipients.map((rid) => ({
        recipient_user_id: rid,
        title: `Pitch deck shared: ${deck.name}`,
        body: message?.trim() || 'A founder shared a pitch deck with you.',
        type: 'PITCH_DECK_SHARED',
        data: {
          deck_id: deck.id,
          deck_name: deck.name,
          file_path: deck.filePath,
          signed_url: signed.signedUrl,
          from_user_id: user.id,
          from_email: user.email,
        },
        is_read: false,
      }))

      const { error: notifError } = await supabase.from('notifications').insert(notifRows)
      if (notifError) throw notifError

      alert('Sent to selected investors!')
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      alert(e.message || 'Failed to share deck.')
    } finally {
      setSending(false)
    }
  }

  const selectedCount = selected.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share pitch deck</DialogTitle>
        </DialogHeader>

        {!deck ? (
          <div className="text-sm text-muted-foreground">No deck selected.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {deck.name}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Select investors and send directly as a notification.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search investors…"
                  className="pl-9"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSelected(new Set(investors.map((x) => x.userId)))}
                disabled={loading || investors.length === 0}
              >
                Select all
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSelected(new Set())}
                disabled={selectedCount === 0}
              >
                Clear
              </Button>
            </div>

            <div className="rounded-lg border border-slate-800 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-sm text-muted-foreground">Loading investors…</div>
              ) : filtered.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">No investors found.</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {filtered.map((inv) => {
                    const checked = selected.has(inv.userId)
                    return (
                      <label
                        key={inv.userId}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-900/50"
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleUser(inv.userId)} />
                        <div className="text-sm">{inv.label}</div>
                        <div className="ml-auto text-xs text-muted-foreground">
                          {String(inv.userId).slice(0, 8)}…
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Message (optional)</div>
              <Textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write a short note to the investor…"
              />
              <div className="text-xs text-muted-foreground">
                Sending to: <span className="font-medium">{selectedCount}</span> investor(s)
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending || selectedCount === 0}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
