'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import supabase from '@/lib/supabaseClient'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Paperclip, Pin, PinOff, FileText, Lock, Plus, MessageCircle, ArrowRight, GripVertical } from 'lucide-react'
import { formatDate } from '@/lib/utils'

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/* ──────────────────────────────────────────────────────────────
   TABLES
────────────────────────────────────────────────────────────── */
const OPPORTUNITIES_TABLE = 'fundraising_opportunities'
const INVESTORS_TABLE = 'investors'
const PROFILES_TABLE = 'profiles'

const MESSAGES_TABLE = 'pipeline_messages' // ✅ unified
const UNLOCKED_TABLE = 'unlocked_pipeline_chats'
const UNLOCK_RPC = 'unlock_pipeline_chat'

// when founder sends pitch
const PITCH_SHARES_TABLE = 'pitch_deck_shares'

// when investor clicks Express Interest (your existing pipeline table)
const EXPRESS_INTEREST_TABLE = 'investor_pipeline'

/* ─── Stage config ─────────────────────────────────────── */
const PIPELINE_STAGES = [
  { id: 'TO_CONTACT', title: 'To Contact', bar: 'bg-slate-800/70 text-slate-100', chip: 'bg-slate-900/60' },
  { id: 'CONTACTED', title: 'Contacted', bar: 'bg-blue-800/70 text-blue-50', chip: 'bg-blue-900/60' },
  { id: 'MEETING', title: 'Meeting', bar: 'bg-amber-800/70 text-amber-50', chip: 'bg-amber-900/60' },
  { id: 'DILIGENCE', title: 'Due Diligence', bar: 'bg-violet-800/70 text-violet-50', chip: 'bg-violet-900/60' },
  { id: 'COMMITTED', title: 'Committed', bar: 'bg-emerald-800/70 text-emerald-50', chip: 'bg-emerald-900/60' },
  { id: 'LOST', title: 'Lost', bar: 'bg-rose-800/70 text-rose-50', chip: 'bg-rose-900/60' },
]

const STAGE_ORDER = PIPELINE_STAGES.map((x) => x.id)
const s = (v) => (v == null ? '' : String(v))

// show chat only in these stages
const STAGES_WITH_CHAT = new Set(['CONTACTED', 'MEETING', 'DILIGENCE', 'COMMITTED'])

const NEXT_STAGE = {
  TO_CONTACT: 'CONTACTED',
  CONTACTED: 'MEETING',
  MEETING: 'DILIGENCE',
  DILIGENCE: 'COMMITTED',
  COMMITTED: null,
  LOST: null,
}

function stageTitle(stageId) {
  return PIPELINE_STAGES.find((x) => x.id === stageId)?.title || stageId
}

function mapOpportunityRow(row) {
  return {
    id: row.id,
    stage: row.stage,
    rating: row.rating,
    notes: row.notes,
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    investor_id: row.investor_id,
    founder_id: row.founder_id,
  }
}

/* ──────────────────────────────────────────────────────────────
   ChatBox (unlock + pinned + files)  ✅ uses pipeline_messages
────────────────────────────────────────────────────────────── */
function ChatBox({ pipelineId, currentUserId, initiallyUnlocked = false, onUnlocked }) {
  const [unlocked, setUnlocked] = useState(initiallyUnlocked)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState(null)

  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    if (!unlocked || !pipelineId) return
    let cancelled = false

    async function loadMessages() {
      setLoading(true)
      const { data, error } = await supabase
        .from(MESSAGES_TABLE)
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: true })

      if (cancelled) return

      if (error) {
        console.error('loadMessages error:', error)
        setMessages([])
      } else {
        setMessages(data || [])
      }
      setLoading(false)
    }

    loadMessages()

    const channel = supabase
      .channel(`${MESSAGES_TABLE}_${pipelineId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: MESSAGES_TABLE, filter: `pipeline_id=eq.${pipelineId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: MESSAGES_TABLE, filter: `pipeline_id=eq.${pipelineId}` },
        (payload) => setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)))
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [pipelineId, unlocked])

  async function handleUnlock() {
    try {
      setUnlocking(true)
      setUnlockError(null)

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) {
        window.location.href = '/auth/signin'
        return
      }

      const { data, error } = await supabase.rpc(UNLOCK_RPC, { p_pipeline_id: pipelineId })
      if (error) throw error

      if (data?.status === 'insufficient_credits') {
        setUnlockError('Not enough credits. Go to Billing & Credits to top up.')
        return
      }

      setUnlocked(true)
      onUnlocked?.()
    } catch (e) {
      console.error(e)
      setUnlockError(e.message || 'Failed to unlock chat.')
    } finally {
      setUnlocking(false)
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    const trimmed = newMessage.trim()
    if (!trimmed || !unlocked) return

    setSending(true)
    const { error } = await supabase.from(MESSAGES_TABLE).insert({
      pipeline_id: pipelineId,
      sender_id: currentUserId,
      content: trimmed,
    })

    if (error) {
      console.error('sendMessage error:', error)
      alert('Failed to send message: ' + error.message)
    } else {
      setNewMessage('')
    }
    setSending(false)
  }

  async function handleFileChange(e) {
    if (!unlocked) {
      e.target.value = ''
      return
    }

    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    const bucket = 'chat-doc'

    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const path = `${pipelineId}/${Date.now()}_${safeName}`

        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file)
        if (uploadError) {
          alert('Failed to upload file: ' + uploadError.message)
          continue
        }

        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)
        const publicUrl = publicData?.publicUrl

        const { error: insertError } = await supabase.from(MESSAGES_TABLE).insert({
          pipeline_id: pipelineId,
          sender_id: currentUserId,
          content: '',
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type,
        })

        if (insertError) {
          alert('Failed to create file message: ' + insertError.message)
          continue
        }
      }
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function togglePin(message) {
    const { id, is_pinned } = message
    const { error } = await supabase.from(MESSAGES_TABLE).update({ is_pinned: !is_pinned }).eq('id', id)
    if (error) alert('Failed to toggle pin: ' + error.message)
  }

  const pinnedMessages = messages.filter((m) => m.is_pinned)
  const normalMessages = messages.filter((m) => !m.is_pinned)

  if (!unlocked) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-300 mb-1">Chat</div>

        <div className="flex items-center justify-between rounded-md border border-emerald-600/70 bg-emerald-950/40 px-3 py-2">
          <div className="text-[11px] text-emerald-100 mr-3">
            Unlock this private chat. Cost: <span className="font-semibold">1 credit</span>.
          </div>

          <Button
            size="sm"
            onClick={handleUnlock}
            disabled={unlocking}
            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-xs"
          >
            <Lock className="w-3 h-3 mr-1" />
            {unlocking ? 'Unlocking…' : 'Unlock'}
          </Button>
        </div>

        {unlockError && <p className="text-[11px] text-red-400">{unlockError}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {pinnedMessages.length > 0 && (
        <div className="border border-yellow-600/60 bg-yellow-950/40 rounded p-2 mb-2 space-y-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-yellow-300 uppercase tracking-wide">
            <Pin className="w-3 h-3" />
            Pinned
          </div>

          <div className="space-y-1 max-h-24 overflow-y-auto">
            {pinnedMessages.map((m) => (
              <div key={m.id} className="text-xs text-yellow-100/90 flex justify-between gap-2">
                <div className="truncate">
                  {m.file_name ? (
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="underline truncate">
                        {m.file_name}
                      </a>
                    </span>
                  ) : (
                    m.content || '[no text]'
                  )}
                </div>
                <button type="button" onClick={() => togglePin(m)} className="text-[10px] opacity-80 hover:opacity-100">
                  Unpin
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto space-y-1 text-sm border border-slate-800 rounded p-2 bg-slate-950/60">
        {loading ? (
          <div className="text-xs text-slate-500">Loading chat…</div>
        ) : normalMessages.length === 0 ? (
          <div className="text-xs text-slate-500">No messages yet. Say hi 👋</div>
        ) : (
          normalMessages.map((m) => {
            const isMe = s(m.sender_id) === s(currentUserId)
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative group max-w-[80%] px-2 py-1 rounded-lg text-xs shadow-sm ${isMe ? 'bg-emerald-600 text-emerald-50' : 'bg-slate-800 text-slate-50'}`}>
                  {m.file_url && (
                    <a href={m.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 mb-0.5 underline">
                      <FileText className="w-3 h-3" />
                      <span className="truncate">{m.file_name}</span>
                    </a>
                  )}

                  {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}

                  <div className="flex items-center justify-between mt-0.5">
                    <div className="text-[10px] opacity-80">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 mt-1">
        <label className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-700 bg-slate-900 hover:bg-slate-800 cursor-pointer text-slate-200">
          <Paperclip className="w-4 h-4" />
          <input type="file" className="hidden" multiple onChange={handleFileChange} />
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

      {uploading && <div className="text-[11px] text-slate-400">Uploading document…</div>}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Sortable card + chat popup
────────────────────────────────────────────────────────────── */
function SortableOpportunity({ opportunity, investorsById, currentUserId, unlocked, onUnlocked, onMoveNext }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: opportunity.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const [chatOpen, setChatOpen] = useState(false)

  const inv = investorsById[opportunity.investor_id]
  const investorName = inv?.name || `Investor ${s(opportunity.investor_id).slice(0, 8)}…`
  const orgName = inv?.org || ''

  const canChat = STAGES_WITH_CHAT.has(opportunity.stage)
  const nextStage = NEXT_STAGE[opportunity.stage]
  const canMoveNext = Boolean(nextStage)

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-slate-950/40 border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <button
                type="button"
                className="mt-[2px] h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/40 text-slate-300 hover:text-slate-100 hover:bg-slate-900 cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
                aria-label="Drag"
              >
                <GripVertical className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <CardTitle className="text-sm truncate max-w-[220px]">{investorName}</CardTitle>
                  {unlocked && (
                    <span className="text-[10px] rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400 border border-emerald-500/20">
                      Unlocked
                    </span>
                  )}
                </div>

                {orgName ? (
                  <CardDescription className="text-xs truncate max-w-[260px]">{orgName}</CardDescription>
                ) : null}

                <div className="text-[11px] text-slate-400 mt-1">
                  Updated {formatDate(opportunity.updatedAt)}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] px-2 py-1 rounded-full border-0 bg-slate-900/60 text-slate-100">
                {stageTitle(opportunity.stage)}
              </Badge>

              {canChat && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-slate-800 bg-slate-950/40 hover:bg-slate-900"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setChatOpen(true)
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!canMoveNext}
                className="h-9 w-9 rounded-xl border-slate-800 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-40"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (canMoveNext) onMoveNext?.(opportunity.id, nextStage)
                }}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {opportunity.notes ? (
            <div className="text-xs text-slate-300">
              <div className="text-[11px] text-slate-400">Notes</div>
              <div className="whitespace-pre-wrap break-words mt-1">{opportunity.notes}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span className="truncate">Chat — {investorName}</span>
              <Badge variant="secondary" className="text-[10px] px-2 py-1 rounded-full border-0 bg-slate-900/60 text-slate-100">
                {stageTitle(opportunity.stage)}
              </Badge>
            </DialogTitle>
            <DialogDescription>Private chat (unlock if required).</DialogDescription>
          </DialogHeader>

          <div className="pt-2">
            <ChatBox
              pipelineId={opportunity.id}
              currentUserId={currentUserId}
              initiallyUnlocked={unlocked}
              onUnlocked={onUnlocked}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─── Droppable column ─────────────────────────────────── */
function Column({ stage, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div className="min-w-[320px] flex flex-col">
      <div className={`rounded-xl ${stage.bar} mb-3 px-3 py-2`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{stage.title}</h3>
          <Badge variant="secondary" className={`text-xs border-0 ${stage.chip}`}>{count}</Badge>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`space-y-3 rounded-lg border border-border/40 p-2 transition-colors ${isOver ? 'bg-muted/30' : 'bg-transparent'}`}
        style={{ minHeight: 260, maxHeight: '72vh', overflowY: 'auto' }}
      >
        {children}
        {count === 0 && <div className="text-center py-8 text-muted-foreground text-sm">Drop opportunities here</div>}
      </div>
    </div>
  )
}

/* ─── Add Opportunity dialog ───────────────────────────── */
function AddOpportunityDialog({ open, onOpenChange, investors, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ investor_id: '', stage: 'TO_CONTACT', rating: '', notes: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error('You must be logged in.')
      if (!form.investor_id) throw new Error('Please choose an investor.')

      const { data, error } = await supabase
        .from(OPPORTUNITIES_TABLE)
        .upsert(
          [{
            founder_id: user.id,
            investor_id: form.investor_id,
            stage: form.stage,
            rating: form.rating ? Number(form.rating) : null,
            notes: form.notes || null,
            updated_at: new Date().toISOString(),
          }],
          { onConflict: 'founder_id,investor_id' }
        )
        .select('id, stage, rating, notes, updated_at, founder_id, investor_id')
        .single()

      if (error) throw error

      onCreated?.(mapOpportunityRow(data))
      setForm({ investor_id: '', stage: 'TO_CONTACT', rating: '', notes: '' })
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
          <DialogDescription>Link an investor to your fundraising pipeline.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>Investor</Label>
            {investors.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">No investors found.</p>
            ) : (
              <Select value={form.investor_id} onValueChange={(val) => setForm((p) => ({ ...p, investor_id: val }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose an investor" /></SelectTrigger>
                <SelectContent>
                  {investors.map((inv) => (
                    <SelectItem key={inv.user_id} value={String(inv.user_id)}>
                      {(inv.display_name || inv.investor_type || 'Investor')} — {(inv.sectors || 'No sectors')}
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
                  {PIPELINE_STAGES.map((st) => (
                    <SelectItem key={st.id} value={st.id}>{st.title}</SelectItem>
                  ))}
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
              placeholder="Warm intro from..., next steps..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || investors.length === 0}>
              {saving ? 'Saving…' : 'Save Opportunity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Main Founder page ────────────────────────────────── */
export default function FundraisingCRM() {
  const [opportunities, setOpportunities] = useState([])
  const [investors, setInvestors] = useState([])
  const [investorsById, setInvestorsById] = useState({})
  const [unlockedSet, setUnlockedSet] = useState(new Set())

  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

  const opportunitiesRef = useRef(opportunities)
  useEffect(() => { opportunitiesRef.current = opportunities }, [opportunities])

  const investorsByIdRef = useRef(investorsById)
  useEffect(() => { investorsByIdRef.current = investorsById }, [investorsById])

  const currentUserIdRef = useRef(currentUserId)
  useEffect(() => { currentUserIdRef.current = currentUserId }, [currentUserId])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  async function ensureInvestorName(investorId) {
    if (!investorId) return
    if (investorsByIdRef.current?.[investorId]) return

    const { data: inv, error: invErr } = await supabase
      .from(INVESTORS_TABLE)
      .select('user_id, display_name, investor_type, firm_name, org_name, sectors, name')
      .eq('user_id', investorId)
      .maybeSingle()

    if (!invErr && inv) {
      const nm = (inv.display_name || inv.name || inv.firm_name || inv.investor_type || '').trim()
      setInvestorsById((prev) => ({
        ...prev,
        [inv.user_id]: {
          name: nm || `Investor ${String(inv.user_id).slice(0, 8)}…`,
          org: inv.org_name || inv.firm_name || inv.sectors || '',
        },
      }))
      return
    }

    const { data: prof, error: profErr } = await supabase
      .from(PROFILES_TABLE)
      .select('id, full_name')
      .eq('id', investorId)
      .maybeSingle()

    if (!profErr && prof) {
      const nm = (prof.full_name || '').trim()
      setInvestorsById((prev) => ({
        ...prev,
        [prof.id]: { name: nm || `Investor ${String(prof.id).slice(0, 8)}…`, org: '' },
      }))
    }
  }

  async function ensureOpportunityToContact(investorUserId) {
    const founderId = currentUserIdRef.current
    if (!founderId || !investorUserId) return

    await ensureInvestorName(investorUserId)

    const { data: existing, error: selErr } = await supabase
      .from(OPPORTUNITIES_TABLE)
      .select('id')
      .eq('founder_id', founderId)
      .eq('investor_id', investorUserId)
      .maybeSingle()

    if (selErr) return

    const nowIso = new Date().toISOString()

    if (existing?.id) {
      const { data, error } = await supabase
        .from(OPPORTUNITIES_TABLE)
        .update({ updated_at: nowIso })
        .eq('id', existing.id)
        .select('id, stage, rating, notes, updated_at, founder_id, investor_id')
        .single()

      if (!error && data) {
        const mapped = mapOpportunityRow(data)
        setOpportunities((prev) => [mapped, ...prev.filter((o) => o.id !== mapped.id)])
      }
      return
    }

    const { data, error } = await supabase
      .from(OPPORTUNITIES_TABLE)
      .insert([{
        founder_id: founderId,
        investor_id: investorUserId,
        stage: 'TO_CONTACT',
        updated_at: nowIso,
      }])
      .select('id, stage, rating, notes, updated_at, founder_id, investor_id')
      .single()

    if (!error && data) {
      const mapped = mapOpportunityRow(data)
      setOpportunities((prev) => [mapped, ...prev.filter((o) => o.id !== mapped.id)])
    }
  }

  async function backfillToContact(founderId) {
    try {
      const ids = new Set()

      const { data: shares } = await supabase
        .from(PITCH_SHARES_TABLE)
        .select('investor_user_id, investor_id, recipient_user_id')
        .eq('founder_id', founderId)
        .order('created_at', { ascending: false })
        .limit(200)

      if (shares?.length) {
        for (const r of shares) {
          const id = r.investor_user_id || r.investor_id || r.recipient_user_id
          if (id) ids.add(id)
        }
      }

      const { data: interests } = await supabase
        .from(EXPRESS_INTEREST_TABLE)
        .select('investor_id')
        .eq('startup_id', founderId)
        .order('created_at', { ascending: false })
        .limit(200)

      if (interests?.length) {
        for (const r of interests) if (r.investor_id) ids.add(r.investor_id)
      }

      const allInvestorIds = Array.from(ids).filter(Boolean)
      if (!allInvestorIds.length) return

      await Promise.all(allInvestorIds.slice(0, 50).map((id) => ensureInvestorName(id)))

      const { data: existing } = await supabase
        .from(OPPORTUNITIES_TABLE)
        .select('investor_id')
        .eq('founder_id', founderId)
        .in('investor_id', allInvestorIds)

      const existingIds = new Set((existing || []).map((r) => r.investor_id))
      const missing = allInvestorIds.filter((id) => !existingIds.has(id))
      const now = new Date().toISOString()

      if (missing.length) {
        await supabase
          .from(OPPORTUNITIES_TABLE)
          .insert(missing.map((investorId) => ({
            founder_id: founderId,
            investor_id: investorId,
            stage: 'TO_CONTACT',
            updated_at: now,
          })))
      }

      const toBump = allInvestorIds.filter((id) => existingIds.has(id))
      if (toBump.length) {
        await supabase
          .from(OPPORTUNITIES_TABLE)
          .update({ updated_at: now })
          .eq('founder_id', founderId)
          .in('investor_id', toBump)
      }
    } catch (e) {
      console.error('backfillToContact failed:', e)
    }
  }

  async function applyStageChange(opportunityId, targetStage) {
    const snapshot = opportunitiesRef.current
    const now = new Date()

    setOpportunities((prev) =>
      prev.map((o) => (o.id === opportunityId ? { ...o, stage: targetStage, updatedAt: now } : o))
    )

    const { error } = await supabase
      .from(OPPORTUNITIES_TABLE)
      .update({ stage: targetStage, updated_at: now.toISOString() })
      .eq('id', opportunityId)

    if (error) {
      console.error('stage update failed:', error)
      setOpportunities(snapshot)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadAll() {
      try {
        setLoading(true)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) { window.location.href = '/auth/signin'; return }

        if (cancelled) return
        setCurrentUserId(user.id)
        currentUserIdRef.current = user.id

        await backfillToContact(user.id)

        const { data: invRows } = await supabase.from(INVESTORS_TABLE).select('*')
        if (!cancelled) setInvestors(invRows || [])

        const { data: oppRows, error: oppErr } = await supabase
          .from(OPPORTUNITIES_TABLE)
          .select('id, stage, rating, notes, updated_at, founder_id, investor_id')
          .eq('founder_id', user.id)
          .order('updated_at', { ascending: false })

        if (oppErr) throw oppErr
        const mapped = (oppRows || []).map(mapOpportunityRow)

        const { data: unlockRows } = await supabase
          .from(UNLOCKED_TABLE)
          .select('pipeline_id')
          .eq('user_id', user.id)

        const uSet = new Set()
        if (unlockRows?.length) for (const r of unlockRows) uSet.add(r.pipeline_id)

        const investorIds = Array.from(new Set(mapped.map((o) => o.investor_id).filter(Boolean)))
        const map = {}

        if (investorIds.length) {
          const { data: invDetails } = await supabase
            .from(INVESTORS_TABLE)
            .select('user_id, display_name, investor_type, firm_name, org_name, sectors, name')
            .in('user_id', investorIds)

          if (invDetails?.length) {
            for (const r of invDetails) {
              const name = (r.display_name || r.name || r.firm_name || r.investor_type || '').trim()
              map[r.user_id] = {
                name: name || `Investor ${String(r.user_id).slice(0, 8)}…`,
                org: r.org_name || r.firm_name || r.sectors || '',
              }
            }
          } else {
            const { data: profs } = await supabase
              .from(PROFILES_TABLE)
              .select('id, full_name')
              .in('id', investorIds)

            if (profs?.length) {
              for (const p of profs) {
                const nm = (p.full_name || '').trim()
                map[p.id] = { name: nm || `Investor ${String(p.id).slice(0, 8)}…`, org: '' }
              }
            }
          }
        }

        if (cancelled) return
        setUnlockedSet(uSet)
        setInvestorsById(map)
        setOpportunities(mapped)
      } catch (e) {
        console.error('CRM load error:', e)
        if (!cancelled) {
          setOpportunities([])
          setInvestors([])
          setInvestorsById({})
          setUnlockedSet(new Set())
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAll()
    return () => { cancelled = true }
  }, [])

  const grouped = useMemo(() => {
    const g = Object.fromEntries(STAGE_ORDER.map((id) => [id, []]))
    for (const o of opportunities) {
      if (!g[o.stage]) g[o.stage] = []
      g[o.stage].push(o)
    }
    return g
  }, [opportunities])

  const stageOfItem = (itemId) => opportunities.find((o) => o.id === itemId)?.stage || null

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return

    const targetStage = PIPELINE_STAGES.some((st) => st.id === over.id) ? over.id : stageOfItem(over.id)
    if (!targetStage) return

    const opportunityId = active.id
    const from = stageOfItem(opportunityId)
    if (!from || from === targetStage) return

    await applyStageChange(opportunityId, targetStage)
  }

  if (loading) return <div className="text-muted-foreground">Loading Pipeline…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Fundraising CRM</h1>
          <p className="text-muted-foreground">
            Pitch sent / Investor “Express Interest” → auto appears in <b>TO_CONTACT</b>
          </p>
        </div>

        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Opportunity
        </Button>
      </div>

      <AddOpportunityDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        investors={investors}
        onCreated={(op) => setOpportunities((prev) => [op, ...prev.filter((x) => x.id !== op.id)])}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 overflow-x-auto pb-2 [grid-template-columns:repeat(6,minmax(320px,1fr))]">
          {PIPELINE_STAGES.map((stage) => {
            const items = grouped[stage.id] || []
            return (
              <div key={stage.id}>
                <SortableContext items={items.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                  <Column stage={stage} count={items.length}>
                    {items.map((op) => (
                      <SortableOpportunity
                        key={op.id}
                        opportunity={op}
                        investorsById={investorsById}
                        currentUserId={currentUserId}
                        unlocked={unlockedSet.has(op.id)}
                        onUnlocked={() => setUnlockedSet((prev) => new Set(prev).add(op.id))}
                        onMoveNext={(id, next) => applyStageChange(id, next)}
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
