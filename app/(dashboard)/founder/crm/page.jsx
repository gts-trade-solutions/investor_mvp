// app/founder/fundraising-crm/page.jsx (or wherever this lives)
'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, MoreHorizontal } from 'lucide-react'
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

/* ─── Stage config ─────────────────────────────────────── */
const PIPELINE_STAGES = [
  {
    id: 'TO_CONTACT',
    title: 'To Contact',
    bar: 'bg-slate-800/70 text-slate-100',
    chip: 'bg-slate-900/60',
  },
  {
    id: 'CONTACTED',
    title: 'Contacted',
    bar: 'bg-blue-800/70 text-blue-50',
    chip: 'bg-blue-900/60',
  },
  {
    id: 'MEETING',
    title: 'Meeting',
    bar: 'bg-amber-800/70 text-amber-50',
    chip: 'bg-amber-900/60',
  },
  {
    id: 'DILIGENCE',
    title: 'Due Diligence',
    bar: 'bg-violet-800/70 text-violet-50',
    chip: 'bg-violet-900/60',
  },
  {
    id: 'COMMITTED',
    title: 'Committed',
    bar: 'bg-emerald-800/70 text-emerald-50',
    chip: 'bg-emerald-900/60',
  },
  {
    id: 'LOST',
    title: 'Lost',
    bar: 'bg-rose-800/70 text-rose-50',
    chip: 'bg-rose-900/60',
  },
]

/* Helper to normalize DB row -> card props */
function mapOpportunityRow(row) {
  return {
    id: row.id,
    stage: row.stage,
    rating: row.rating,
    notes: row.notes,
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    investor_id: row.investor_id,
  }
}

/* ─── Sortable card ────────────────────────────────────── */
function SortableOpportunity({ opportunity, onEdit, investors }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: opportunity.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  // Look up investor details from investors[] by user_id
  const investor = investors.find(
    (inv) => inv.user_id === opportunity.investor_id
  )

  const investorName =
    investor?.display_name ||
    investor?.name ||
    investor?.firm_name ||
    investor?.investor_type ||
    'Unknown investor'

  const orgName =
    investor?.org_name || investor?.firm_name || investor?.sectors || ''

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-3 cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-sm">{investorName}</CardTitle>
              <CardDescription className="text-xs">{orgName}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onEdit(opportunity)}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {opportunity.rating && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-muted-foreground">Rating:</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${
                      i < opportunity.rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Updated {formatDate(opportunity.updatedAt)}
          </div>

          {opportunity.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {opportunity.notes}
            </p>
          )}

          {/* Call / Email / Meeting buttons removed as requested */}
        </CardContent>
      </Card>
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
          <Badge
            variant="secondary"
            className={`text-xs border-0 ${stage.chip}`}
          >
            {count}
          </Badge>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`space-y-3 rounded-lg border border-border/40 p-2 transition-colors ${
          isOver ? 'bg-muted/30' : 'bg-transparent'
        }`}
        style={{
          minHeight: 240,
          maxHeight: '70vh',
          overflowY: 'auto',
          willChange: 'transform',
        }}
      >
        {children}
        {count === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Drop opportunities here
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Add Opportunity dialog ───────────────────────────── */
function AddOpportunityDialog({ open, onOpenChange, investors, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    investor_id: '',
    stage: 'TO_CONTACT',
    rating: '',
    notes: '',
  })

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleStageChange = (value) => {
    setForm((prev) => ({ ...prev, stage: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) throw new Error('You must be logged in to add an opportunity.')

      if (!form.investor_id) throw new Error('Please choose an investor.')

      const { data, error } = await supabase
        .from('fundraising_opportunities')
        .insert([
          {
            founder_id: user.id,
            investor_id: form.investor_id,
            stage: form.stage,
            rating: form.rating ? Number(form.rating) : null,
            notes: form.notes || null,
          },
        ])
        .select(
          `
          id,
          stage,
          rating,
          notes,
          updated_at,
          founder_id,
          investor_id
        `
        )
        .single()

      if (error) throw error

      const mapped = mapOpportunityRow(data)

      if (onCreated) onCreated(mapped)

      setForm({ investor_id: '', stage: 'TO_CONTACT', rating: '', notes: '' })
      onOpenChange(false)
    } catch (err) {
      console.error('Error creating opportunity:', err)
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
          <DialogDescription>
            Link an investor to your fundraising pipeline.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>Investor</Label>
            {investors.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                No investors found. Add investors first.
              </p>
            ) : (
              <Select
                value={form.investor_id}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, investor_id: val }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose an investor" />
                </SelectTrigger>
                <SelectContent>
                  {investors.map((inv) => (
                    <SelectItem key={inv.user_id} value={inv.user_id}>
                      {inv.investor_type || 'Investor'} –{' '}
                      {inv.sectors || 'No sectors'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={handleStageChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
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
                onChange={handleChange('rating')}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              className="mt-1"
              rows={3}
              value={form.notes}
              onChange={handleChange('notes')}
              placeholder="Warm intro from..., next steps..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || investors.length === 0}>
              {saving ? 'Saving…' : 'Save Opportunity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Main CRM component ───────────────────────────────── */
export default function FundraisingCRM() {
  const [opportunities, setOpportunities] = useState([])
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [activityDialog, setActivityDialog] = useState({
    open: false,
    opportunity: null,
    type: null,
    notes: '',
  })
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  /* Initial load */
  useEffect(() => {
    let cancelled = false

    async function loadData() {
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

        // load investors
        const { data: investorRows, error: invError } = await supabase
          .from('investors')
          .select('*')
        if (invError) throw invError
        if (!cancelled) setInvestors(investorRows || [])

        // load opportunities for this founder
        const { data, error } = await supabase
          .from('fundraising_opportunities')
          .select(
            `
            id,
            stage,
            rating,
            notes,
            updated_at,
            founder_id,
            investor_id
          `
          )
          .eq('founder_id', user.id)
          .order('updated_at', { ascending: false })

        if (error) throw error

        if (!cancelled) {
          const normalized = (data || []).map(mapOpportunityRow)
          setOpportunities(normalized)
        }
      } catch (err) {
        console.error('Error loading CRM data:', err)
        if (!cancelled) {
          setOpportunities([])
          setInvestors([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  /* Realtime sync: fundraising_opportunities */
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel(`fundraising_opportunities_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fundraising_opportunities',
        },
        (payload) => {
          const row = payload.new ?? payload.old
          if (!row || row.founder_id !== currentUserId) return

          if (payload.eventType === 'INSERT') {
            setOpportunities((prev) => {
              const mapped = mapOpportunityRow(payload.new)
              const without = prev.filter((o) => o.id !== mapped.id)
              return [mapped, ...without]
            })
          } else if (payload.eventType === 'UPDATE') {
            setOpportunities((prev) => {
              const mapped = mapOpportunityRow(payload.new)
              const exists = prev.some((o) => o.id === mapped.id)
              if (!exists) return [mapped, ...prev]
              return prev.map((o) => (o.id === mapped.id ? mapped : o))
            })
          } else if (payload.eventType === 'DELETE') {
            setOpportunities((prev) =>
              prev.filter((o) => o.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  const stageOfItem = (itemId) => {
    const item = opportunities.find((o) => o.id === itemId)
    return item?.stage || null
  }

  const getOpportunitiesByStage = (stageId) =>
    opportunities.filter((o) => o.stage === stageId)

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over) return

    let targetStage = PIPELINE_STAGES.some((s) => s.id === over.id)
      ? over.id
      : stageOfItem(over.id)
    if (!targetStage) return

    const opportunityId = active.id

    // optimistic UI
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === opportunityId
          ? { ...o, stage: targetStage, updatedAt: new Date() }
          : o
      )
    )

    const { error } = await supabase
      .from('fundraising_opportunities')
      .update({ stage: targetStage, updated_at: new Date().toISOString() })
      .eq('id', opportunityId)

    if (error) console.error('Error updating stage:', error)
  }

  const handleSaveActivity = async () => {
    const { opportunity, type, notes } = activityDialog
    if (!opportunity || !type) return

    try {
      const { error } = await supabase.from('fundraising_activities').insert([
        {
          opportunity_id: opportunity.id,
          activity_type: type,
          notes,
        },
      ])
      if (error) throw error
      setActivityDialog({
        open: false,
        opportunity: null,
        type: null,
        notes: '',
      })
    } catch (err) {
      console.error('Error saving activity:', err)
      alert('Failed to save activity')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fundraising CRM</h1>
          <p className="text-muted-foreground">Loading CRM...</p>
        </div>
      </div>
    )
  }

  // For the activity dialog description (if you decide to use it later)
  const activityInvestor =
    activityDialog.opportunity &&
    investors.find(
      (inv) => inv.user_id === activityDialog.opportunity.investor_id
    )
  const activityInvestorName =
    activityInvestor?.display_name ||
    activityInvestor?.name ||
    activityInvestor?.firm_name ||
    activityInvestor?.investor_type ||
    'this investor'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fundraising CRM</h1>
          <p className="text-muted-foreground">
            Manage your investor relationships and track fundraising progress
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Opportunity
        </Button>
      </div>

      {/* Add Opportunity dialog */}
      <AddOpportunityDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        investors={investors}
        onCreated={(op) => setOpportunities((prev) => [op, ...prev])}
      />

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-6 overflow-x-auto pb-2 [grid-template-columns:repeat(6,minmax(280px,1fr))]">
          {PIPELINE_STAGES.map((stage) => {
            const items = getOpportunitiesByStage(stage.id)
            return (
              <div key={stage.id}>
                <SortableContext
                  items={items.map((o) => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Column stage={stage} count={items.length}>
                    {items.map((opportunity) => (
                      <SortableOpportunity
                        key={opportunity.id}
                        opportunity={opportunity}
                        onEdit={() => {}}
                        investors={investors}
                      />
                    ))}
                  </Column>
                </SortableContext>
              </div>
            )
          })}
        </div>
      </DndContext>

      {/* Activity dialog (still here, but no call/email/meeting buttons on cards) */}
      <Dialog
        open={activityDialog.open}
        onOpenChange={(open) =>
          setActivityDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {activityDialog.type} Activity
            </DialogTitle>
            <DialogDescription>
              {activityDialog.opportunity &&
                `Record your interaction with ${activityInvestorName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Activity Type</Label>
              <Select
                value={activityDialog.type || ''}
                onValueChange={(val) =>
                  setActivityDialog((prev) => ({ ...prev, type: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                rows={4}
                value={activityDialog.notes}
                onChange={(e) =>
                  setActivityDialog((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="What happened in this interaction?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActivityDialog({
                  open: false,
                  opportunity: null,
                  type: null,
                  notes: '',
                })
              }
            >
              Cancel
            </Button>
            <Button onClick={handleSaveActivity}>Save Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
