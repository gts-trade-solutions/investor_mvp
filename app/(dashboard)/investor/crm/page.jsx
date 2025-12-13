'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import supabase from '@/lib/supabaseClient'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

import { Plus, Paperclip, FileText, MessageCircle, ArrowRight, MoreHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/utils'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/* ─── Tables ───────────────────────────────────────────── */
const OPPORTUNITIES_TABLE = 'fundraising_opportunities'
const FOUNDERS_VIEW = 'founders_with_profile'
const MESSAGES_TABLE = 'pipeline_messages' // ✅ unified

/* ─── Stage config ─────────────────────────────────────── */
const PIPELINE_STAGES = [
  { id: 'TO_CONTACT', title: 'To Contact', bar: 'bg-slate-800/70 text-slate-100', chip: 'bg-slate-900/60' },
  { id: 'CONTACTED', title: 'Contacted', bar: 'bg-blue-800/70 text-blue-50', chip: 'bg-blue-900/60' },
  { id: 'MEETING', title: 'Meeting', bar: 'bg-amber-800/70 text-amber-50', chip: 'bg-amber-900/60' },
  { id: 'DILIGENCE', title: 'Due Diligence', bar: 'bg-violet-800/70 text-violet-50', chip: 'bg-violet-900/60' },
  { id: 'COMMITTED', title: 'Committed', bar: 'bg-emerald-800/70 text-emerald-50', chip: 'bg-emerald-900/60' },
  { id: 'LOST', title: 'Lost', bar: 'bg-rose-800/70 text-rose-50', chip: 'bg-rose-900/60' },
]

const NEXT_STAGE = {
  TO_CONTACT: 'CONTACTED',
  CONTACTED: 'MEETING',
  MEETING: 'DILIGENCE',
  DILIGENCE: 'COMMITTED',
  COMMITTED: null,
  LOST: null,
}

const s = (v) => (v == null ? '' : String(v))
const shortId = (id) => (s(id) ? `${s(id).slice(0, 8)}…` : '')

function stageTitle(stageId) {
  return PIPELINE_STAGES.find((x) => x.id === stageId)?.title || stageId
}

function founderLabel(row) {
  const company = (row?.company_name || '').toString().trim()
  const full = (row?.profile_full_name || '').toString().trim()
  return company || full || `Startup ${shortId(row?.user_id)}`
}

function founderMeta(row) {
  const industry = (row?.industry || '').toString().trim()
  const country = (row?.country || '').toString().trim()
  if (industry && country) return `${industry} • ${country}`
  return industry || country || ''
}

/* ✅ Read founders from VIEW */
async function fetchFoundersFromView({ ids = null, limit = 2000 } = {}) {
  const base = supabase
    .from(FOUNDERS_VIEW)
    .select('user_id, company_name, industry, country, profile_full_name')

  const { data, error } =
    Array.isArray(ids) && ids.length
      ? await base.in('user_id', ids)
      : await base.order('company_name', { ascending: true }).limit(limit)

  return { data: data || [], error: error || null }
}

/* ─── Chat Dialog (✅ pipeline_messages + pipeline_id) ─── */
function ChatDialog({ open, onOpenChange, opportunityId, currentUserId, title }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!open || !opportunityId) return
    let cancelled = false

    async function load() {
      setLoading(true)

      const { data, error } = await supabase
        .from(MESSAGES_TABLE)
        .select('*')
        .eq('pipeline_id', opportunityId) // ✅
        .order('created_at', { ascending: true })

      if (cancelled) return

      if (error) {
        console.error('load chat error:', error)
        setMessages([])
      } else {
        setMessages(data || [])
      }
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel(`${MESSAGES_TABLE}_${opportunityId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: MESSAGES_TABLE, filter: `pipeline_id=eq.${opportunityId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: MESSAGES_TABLE, filter: `pipeline_id=eq.${opportunityId}` },
        (payload) => setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)))
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [open, opportunityId])

  useEffect(() => {
    if (!open) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, open])

  async function sendMessage(e) {
    e.preventDefault()
    const txt = newMessage.trim()
    if (!txt) return

    setSending(true)
    const { error } = await supabase.from(MESSAGES_TABLE).insert({
      pipeline_id: opportunityId, // ✅
      sender_id: currentUserId,
      content: txt,
    })

    if (error) alert('Failed to send: ' + error.message)
    else setNewMessage('')
    setSending(false)
  }

  async function onFileChange(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    const bucket = 'chat-doc'

    try {
      for (const file of files) {
        const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const path = `${opportunityId}/${Date.now()}_${safe}`

        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file)
        if (upErr) {
          alert('Upload failed: ' + upErr.message)
          continue
        }

        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)
        const publicUrl = publicData?.publicUrl

        const { error: msgErr } = await supabase.from(MESSAGES_TABLE).insert({
          pipeline_id: opportunityId, // ✅
          sender_id: currentUserId,
          content: '',
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
        })

        if (msgErr) alert('File message failed: ' + msgErr.message)
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chat</DialogTitle>
          <DialogDescription>{title || 'Conversation'}</DialogDescription>
        </DialogHeader>

        <div className="border border-slate-800 rounded-md p-2 bg-slate-950/60 max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="text-xs text-slate-500">Loading chat…</div>
          ) : messages.length === 0 ? (
            <div className="text-xs text-slate-500">No messages yet.</div>
          ) : (
            <div className="space-y-2">
              {messages.map((m) => {
                const isMe = s(m.sender_id) === s(currentUserId)
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-2 py-1 text-xs ${isMe ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'}`}>
                      {m.file_url ? (
                        <a href={m.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{m.file_name || 'Attachment'}</span>
                        </a>
                      ) : null}
                      {m.content ? <div className="mt-0.5 whitespace-pre-wrap break-words">{m.content}</div> : null}
                      <div className="text-[10px] opacity-80 mt-1">
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex items-center gap-2 mt-2">
          <label className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-800 bg-slate-950/40 hover:bg-slate-900 cursor-pointer">
            <Paperclip className="w-4 h-4 text-slate-200" />
            <input type="file" className="hidden" multiple onChange={onFileChange} />
          </label>

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Type a message…"
            className="bg-slate-950/40 border-slate-800 text-slate-100 placeholder:text-slate-500"
          />

          <Button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? '...' : 'Send'}
          </Button>
        </form>

        {uploading && <div className="text-xs text-slate-400">Uploading…</div>}
      </DialogContent>
    </Dialog>
  )
}

/* ─── Sortable Card ────────────────────────────────────── */
function SortableOpportunity({ opportunity, currentUserId, onMoveNext }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  }

  const [chatOpen, setChatOpen] = useState(false)

  const startupName = opportunity?.startup?.name || 'Startup'
  const startupMeta = opportunity?.startup?.meta || ''

  const canMoveNext = opportunity.stage !== 'LOST'
  const nextStageId = NEXT_STAGE[opportunity.stage]

  async function moveNextStage(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!canMoveNext || !nextStageId) return
    await onMoveNext?.(opportunity.id, nextStageId)
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className="bg-slate-950/40 border-slate-800/70 rounded-2xl overflow-hidden">
        <CardHeader
          className="pb-2 pt-3 cursor-grab active:cursor-grabbing select-none"
          {...attributes}
          {...listeners}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <CardTitle className="text-sm font-semibold truncate max-w-[200px]">
                  {startupName}
                </CardTitle>

                <Badge
                  variant="secondary"
                  className="h-6 px-2 text-[11px] rounded-full border border-slate-800/70 bg-slate-900/50 text-slate-100"
                >
                  {stageTitle(opportunity.stage)}
                </Badge>
              </div>

              {startupMeta ? (
                <CardDescription className="text-xs text-slate-400 truncate max-w-[240px]">
                  {startupMeta}
                </CardDescription>
              ) : null}
            </div>

            <div
              className="shrink-0 flex items-center gap-2"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl border-slate-800/70 bg-slate-950/30 hover:bg-slate-900/40"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setChatOpen(true)
                }}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl border-slate-800/70 bg-slate-950/30 hover:bg-slate-900/40 disabled:opacity-40"
                type="button"
                onClick={moveNextStage}
                disabled={!canMoveNext || !nextStageId}
                title={nextStageId ? `Move to ${stageTitle(nextStageId)}` : 'No next stage'}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl border-slate-800/70 bg-slate-950/30 hover:bg-slate-900/40"
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-3 space-y-2">
          <div className="text-[11px] text-slate-400 whitespace-nowrap">
            Updated {formatDate(opportunity.updatedAt)}
          </div>

          {opportunity.notes ? (
            <div className="text-xs text-slate-300">
              <div className="text-[11px] text-slate-400">Notes</div>
              <div className="mt-0.5 line-clamp-2">{opportunity.notes}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        opportunityId={opportunity.id}
        currentUserId={currentUserId}
        title={`Chat with ${startupName}`}
      />
    </div>
  )
}

/* ─── Droppable column ─────────────────────────────────── */
function Column({ stage, children, count }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  return (
    <div className="min-w-[300px] flex flex-col">
      <div className={`rounded-xl ${stage.bar} mb-3 px-3 py-2`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{stage.title}</h3>
          <Badge variant="secondary" className={`text-xs border-0 ${stage.chip}`}>{count}</Badge>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`space-y-3 rounded-lg border border-border/40 p-2 transition-colors ${isOver ? 'bg-muted/30' : 'bg-transparent'}`}
        style={{ minHeight: 240, maxHeight: '70vh', overflowY: 'auto', willChange: 'transform' }}
      >
        {children}
        {count === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Drop opportunities here</div>
        ) : null}
      </div>
    </div>
  )
}

/* ─── Add Opportunity dialog ───────────────────────────── */
function AddOpportunityDialog({ open, onOpenChange, founders, foundersLoadError, onCreated, currentUserId }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ founder_id: '', stage: 'TO_CONTACT', rating: '', notes: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSaving(true)
      if (!currentUserId) throw new Error('Not logged in.')
      if (!form.founder_id) throw new Error('Please choose a startup.')

      const { data: existing } = await supabase
        .from(OPPORTUNITIES_TABLE)
        .select('id, stage, rating, notes, updated_at, investor_id, founder_id')
        .eq('investor_id', currentUserId)
        .eq('founder_id', form.founder_id)
        .maybeSingle()

      if (existing?.id) {
        const f = founders.find((x) => s(x.id) === s(existing.founder_id))
        onCreated?.({
          id: existing.id,
          stage: existing.stage,
          rating: existing.rating,
          notes: existing.notes,
          updatedAt: existing.updated_at ? new Date(existing.updated_at) : new Date(),
          investor_id: existing.investor_id,
          founder_id: existing.founder_id,
          startup: f || { id: existing.founder_id, name: `Startup ${shortId(existing.founder_id)}`, meta: '' },
        })
        onOpenChange(false)
        return
      }

      const { data, error } = await supabase
        .from(OPPORTUNITIES_TABLE)
        .insert([{
          investor_id: currentUserId,
          founder_id: form.founder_id,
          stage: form.stage,
          rating: form.rating ? Number(form.rating) : null,
          notes: form.notes || null,
          updated_at: new Date().toISOString(),
        }])
        .select('id, stage, rating, notes, updated_at, investor_id, founder_id')
        .single()

      if (error) throw error

      const f = founders.find((x) => s(x.id) === s(form.founder_id))

      onCreated?.({
        id: data.id,
        stage: data.stage,
        rating: data.rating,
        notes: data.notes,
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
        investor_id: data.investor_id,
        founder_id: data.founder_id,
        startup: f || { id: data.founder_id, name: `Startup ${shortId(data.founder_id)}`, meta: '' },
      })

      setForm({ founder_id: '', stage: 'TO_CONTACT', rating: '', notes: '' })
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Failed to create opportunity')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Opportunity</DialogTitle>
          <DialogDescription>Link a startup (founder) to your investment pipeline.</DialogDescription>
        </DialogHeader>

        {foundersLoadError ? (
          <div className="rounded-md border border-amber-400/40 bg-amber-50/40 p-3 text-xs text-amber-800">
            <div className="font-semibold">Founders list is empty / blocked</div>
            <div className="mt-1 whitespace-pre-wrap">{foundersLoadError}</div>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>Startup</Label>
            {founders.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">No startups found.</p>
            ) : (
              <Select value={form.founder_id} onValueChange={(val) => setForm((p) => ({ ...p, founder_id: val }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a startup" /></SelectTrigger>
                <SelectContent>
                  {founders.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}{f.meta ? ` — ${f.meta}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(val) => setForm((p) => ({ ...p, stage: val }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((st) => <SelectItem key={st.id} value={st.id}>{st.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rating (1–5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                className="mt-1"
                value={form.rating}
                onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              className="mt-1"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Why is this startup interesting? Next steps..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || founders.length === 0}>
              {saving ? 'Saving…' : 'Save Opportunity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Main Investor CRM page ───────────────────────────── */
export default function InvestorFundraisingCRM() {
  const [opportunities, setOpportunities] = useState([])
  const [founders, setFounders] = useState([])
  const [foundersLoadError, setFoundersLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const oppSnapshotRef = useRef([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        setLoading(true)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) {
          window.location.href = '/auth/signin'
          return
        }
        setCurrentUserId(user.id)

        // founders dropdown
        setFoundersLoadError('')
        const fRes = await fetchFoundersFromView({ limit: 2000 })
        if (fRes.error) {
          if (!cancelled) {
            setFounders([])
            setFoundersLoadError(fRes.error.message || 'Failed to load founders.')
          }
        } else {
          const mapped = (fRes.data || []).map((r) => ({
            id: r.user_id,
            name: founderLabel(r),
            meta: founderMeta(r),
          }))
          if (!cancelled) setFounders(mapped)
        }

        // opportunities
        const { data: oppRows, error: oppErr } = await supabase
          .from(OPPORTUNITIES_TABLE)
          .select('id, stage, rating, notes, updated_at, investor_id, founder_id')
          .eq('investor_id', user.id)
          .order('updated_at', { ascending: false })

        if (oppErr) throw oppErr

        // enrich founders for cards
        const founderIds = Array.from(new Set((oppRows || []).map((r) => String(r.founder_id)).filter(Boolean)))
        const byId = {}

        if (founderIds.length) {
          const f2 = await fetchFoundersFromView({ ids: founderIds })
          if (!f2.error) {
            for (const r of f2.data || []) {
              byId[String(r.user_id)] = {
                id: r.user_id,
                name: founderLabel(r),
                meta: founderMeta(r),
              }
            }
          }
        }

        const normalized = (oppRows || []).map((row) => {
          const f = byId[String(row.founder_id)]
          return {
            id: row.id,
            stage: row.stage,
            rating: row.rating,
            notes: row.notes,
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            investor_id: row.investor_id,
            founder_id: row.founder_id,
            startup: f || { id: row.founder_id, name: `Startup ${shortId(row.founder_id)}`, meta: '' },
          }
        })

        if (!cancelled) {
          setOpportunities(normalized)
          oppSnapshotRef.current = normalized
        }
      } catch (err) {
        console.error('Investor CRM load error:', err)
        if (!cancelled) {
          setOpportunities([])
          setFounders([])
          setFoundersLoadError(err?.message || 'Failed to load')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [])

  const stageOfItem = (itemId) => opportunities.find((o) => o.id === itemId)?.stage || null
  const getByStage = (stageId) => opportunities.filter((o) => o.stage === stageId)

  async function applyStageChange(opportunityId, targetStage) {
    const snapshot = oppSnapshotRef.current
    const now = new Date()

    setOpportunities((prev) => {
      const next = prev.map((o) => (o.id === opportunityId ? { ...o, stage: targetStage, updatedAt: now } : o))
      oppSnapshotRef.current = next
      return next
    })

    const { error } = await supabase
      .from(OPPORTUNITIES_TABLE)
      .update({ stage: targetStage, updated_at: now.toISOString() })
      .eq('id', opportunityId)

    if (error) {
      console.error('stage update failed:', error)
      setOpportunities(snapshot)
      oppSnapshotRef.current = snapshot
      alert('Failed to move stage: ' + error.message)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over) return

    const targetStage = PIPELINE_STAGES.some((st) => st.id === over.id) ? over.id : stageOfItem(over.id)
    if (!targetStage) return

    const opportunityId = active.id
    const from = stageOfItem(opportunityId)
    if (!from || from === targetStage) return

    await applyStageChange(opportunityId, targetStage)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Fundraising CRM</h1>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fundraising CRM</h1>
          <p className="text-muted-foreground">Investor pipeline with drag stages + chat</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Opportunity
        </Button>
      </div>

      <AddOpportunityDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        founders={founders}
        foundersLoadError={foundersLoadError}
        currentUserId={currentUserId}
        onCreated={(op) => {
          setOpportunities((prev) => {
            const next = [op, ...prev.filter((x) => x.id !== op.id)]
            oppSnapshotRef.current = next
            return next
          })
        }}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 overflow-x-auto pb-2 [grid-template-columns:repeat(6,minmax(280px,1fr))]">
          {PIPELINE_STAGES.map((stage) => {
            const items = getByStage(stage.id)
            return (
              <div key={stage.id}>
                <SortableContext items={items.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                  <Column stage={stage} count={items.length}>
                    {items.map((op) => (
                      <SortableOpportunity
                        key={op.id}
                        opportunity={op}
                        currentUserId={currentUserId}
                        onMoveNext={(id, nextStage) => applyStageChange(id, nextStage)}
                      />
                    ))}
                  </Column>
                </SortableContext>
              </div>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
