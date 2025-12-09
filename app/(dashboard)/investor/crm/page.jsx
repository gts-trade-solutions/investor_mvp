'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, MoreHorizontal, Calendar, Phone, Mail } from 'lucide-react'
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
  { id: 'TO_CONTACT', title: 'To Contact', bar: 'bg-slate-800/70 text-slate-100', chip: 'bg-slate-900/60' },
  { id: 'CONTACTED',  title: 'Contacted',  bar: 'bg-blue-800/70 text-blue-50',   chip: 'bg-blue-900/60'  },
  { id: 'MEETING',    title: 'Meeting',    bar: 'bg-amber-800/70 text-amber-50', chip: 'bg-amber-900/60' },
  { id: 'DILIGENCE',  title: 'Due Diligence', bar: 'bg-violet-800/70 text-violet-50', chip: 'bg-violet-900/60' },
  { id: 'COMMITTED',  title: 'Committed',  bar: 'bg-emerald-800/70 text-emerald-50', chip: 'bg-emerald-900/60' },
  { id: 'LOST',       title: 'Lost',       bar: 'bg-rose-800/70 text-rose-50',   chip: 'bg-rose-900/60'  },
]

/* ─── Sortable card (startup-focused) ──────────────────── */
function SortableOpportunity({ opportunity, onEdit, onAddActivity }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: opportunity.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-3 cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-sm">
                {opportunity.startup.name}
              </CardTitle>
              <CardDescription className="text-xs">
                {opportunity.startup.org.name}
              </CardDescription>
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
                    className={`text-xs ${i < opportunity.rating ? 'text-yellow-400' : 'text-gray-300'}`}
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
            <p className="text-xs text-muted-foreground line-clamp-2">{opportunity.notes}</p>
          )}

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => onAddActivity(opportunity, 'call')}
            >
              <Phone className="h-3 w-3 mr-1" /> Call
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => onAddActivity(opportunity, 'email')}
            >
              <Mail className="h-3 w-3 mr-1" /> Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-xs"
              onClick={() => onAddActivity(opportunity, 'meeting')}
            >
              <Calendar className="h-3 w-3 mr-1" /> Meeting
            </Button>
          </div>
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
          <Badge variant="secondary" className={`text-xs border-0 ${stage.chip}`}>
            {count}
          </Badge>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`space-y-3 rounded-lg border border-border/40 p-2 transition-colors
          ${isOver ? 'bg-muted/30' : 'bg-transparent'}`}
        style={{ minHeight: 240, maxHeight: '70vh', overflowY: 'auto', willChange: 'transform' }}
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

/* ─── Add Opportunity dialog (choose startup) ──────────── */
function AddOpportunityDialog({ open, onOpenChange, startups, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    startup_id: '',
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
      if (!form.startup_id) throw new Error('Please choose a startup.')

      const { data, error } = await supabase
        .from('fundraising_opportunities') // ✅ same table
        .insert([
          {
            investor_id: user.id,             // 👈 investor is the owner here
            startup_id: form.startup_id,      // TODO: ensure this column exists / matches your FK
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
          startup:startups (*)
        `
        ) // TODO: change "startups" to your actual startups table / relationship name
        .single()

      if (error) throw error

      const mapped = {
        id: data.id,
        stage: data.stage,
        rating: data.rating,
        notes: data.notes,
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
        startup: {
          name:
            data.startup?.name ||
            data.startup?.company_name ||
            data.startup?.startup_name ||
            'Unknown startup',
          org: {
            name:
              data.startup?.sector ||
              data.startup?.industry ||
              data.startup?.country ||
              '',
          },
        },
      }

      if (onCreated) onCreated(mapped)

      setForm({ startup_id: '', stage: 'TO_CONTACT', rating: '', notes: '' })
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
            Link a startup to your investment pipeline.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>Startup</Label>
            {startups.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                No startups found. Add startups first.
              </p>
            ) : (
              <Select
                value={form.startup_id}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, startup_id: val }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a startup" />
                </SelectTrigger>
                <SelectContent>
                  {startups.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {(s.company_name || s.name || 'Startup')}{' '}
                      {s.sector ? ` – ${s.sector}` : ''}
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
              placeholder="Why is this startup interesting? Next steps..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || startups.length === 0}>
              {saving ? 'Saving…' : 'Save Opportunity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Main Investor CRM component ──────────────────────── */
export default function InvestorFundraisingCRM() {
  const [opportunities, setOpportunities] = useState([])
  const [startups, setStartups] = useState([])
  const [loading, setLoading] = useState(true)
  const [activityDialog, setActivityDialog] = useState({
    open: false,
    opportunity: null,
    type: null,
    notes: '',
  })
  const [showAddDialog, setShowAddDialog] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

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

        // Load startups the investor can add to their pipeline
        const { data: startupRows, error: startupError } = await supabase
          .from('startups') // TODO: change to your actual startups table
          .select('*')

        if (startupError) throw startupError
        if (!cancelled) setStartups(startupRows || [])

        // Load opportunities for this investor
        const { data, error } = await supabase
          .from('fundraising_opportunities')
          .select(
            `
            id,
            stage,
            rating,
            notes,
            updated_at,
            startup:startups (*)
          `
          ) // TODO: ensure "startup:startups" matches your FK relationship
          .eq('investor_id', user.id)
          .order('updated_at', { ascending: false })

        console.log('investor fundraising_opportunities:', { data, error })
        if (error) throw error

        if (!cancelled) {
          const normalized = (data || []).map((row) => ({
            id: row.id,
            stage: row.stage,
            rating: row.rating,
            notes: row.notes,
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            startup: {
              name:
                row.startup?.name ||
                row.startup?.company_name ||
                row.startup?.startup_name ||
                'Unknown startup',
              org: {
                name:
                  row.startup?.sector ||
                  row.startup?.industry ||
                  row.startup?.country ||
                  '',
              },
            },
          }))
          setOpportunities(normalized)
        }
      } catch (err) {
        console.error('Error loading Investor CRM data:', err)
        if (!cancelled) {
          setOpportunities([])
          setStartups([])
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

  const handleAddActivity = (opportunity, type) => {
    setActivityDialog({ open: true, opportunity, type, notes: '' })
  }

  const handleSaveActivity = async () => {
    const { opportunity, type, notes } = activityDialog
    if (!opportunity || !type) return

    try {
      const { error } = await supabase
        .from('fundraising_activities')
        .insert([
          {
            opportunity_id: opportunity.id,
            activity_type: type,
            notes,
          },
        ])
      if (error) throw error
      setActivityDialog({ open: false, opportunity: null, type: null, notes: '' })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fundraising CRM</h1>
          <p className="text-muted-foreground">
            Manage your startup dealflow and track investment progress.
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
        startups={startups}
        onCreated={(op) => setOpportunities((prev) => [op, ...prev])}
      />

      {/* Kanban board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 overflow-x-auto pb-2 [grid-template-columns:repeat(6,minmax(280px,1fr))]">
          {PIPELINE_STAGES.map((stage) => {
            const items = getOpportunitiesByStage(stage.id)
            return (
              <div key={stage.id}>
                <SortableContext items={items.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                  <Column stage={stage} count={items.length}>
                    {items.map((opportunity) => (
                      <SortableOpportunity
                        key={opportunity.id}
                        opportunity={opportunity}
                        onEdit={() => {}}
                        onAddActivity={handleAddActivity}
                      />
                    ))}
                  </Column>
                </SortableContext>
              </div>
            )
          })}
        </div>
      </DndContext>

      {/* Activity dialog */}
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
                `Record your interaction with ${activityDialog.opportunity.startup.name}`}
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
                  setActivityDialog((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="What happened in this interaction?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActivityDialog({ open: false, opportunity: null, type: null, notes: '' })
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
