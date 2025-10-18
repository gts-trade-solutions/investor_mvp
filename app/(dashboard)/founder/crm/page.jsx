'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, MoreHorizontal, Calendar, Phone, Mail, MessageSquare } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PIPELINE_STAGES = [
  { id: 'TO_CONTACT', title: 'To Contact', color: 'bg-gray-100' },
  { id: 'CONTACTED', title: 'Contacted', color: 'bg-blue-100' },
  { id: 'MEETING', title: 'Meeting', color: 'bg-yellow-100' },
  { id: 'DILIGENCE', title: 'Due Diligence', color: 'bg-purple-100' },
  { id: 'COMMITTED', title: 'Committed', color: 'bg-green-100' },
  { id: 'LOST', title: 'Lost', color: 'bg-red-100' }
]

function SortableOpportunity({ opportunity, onEdit, onAddActivity }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: opportunity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-sm">{opportunity.investor.name}</CardTitle>
              <CardDescription className="text-xs">
                {opportunity.investor.org.name}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(opportunity)}>
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
                      i < opportunity.rating ? 'text-yellow-400' : 'text-gray-300'
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

          <div className="flex space-x-1">
            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => onAddActivity(opportunity, 'call')}>
              <Phone className="h-3 w-3 mr-1" />
              Call
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => onAddActivity(opportunity, 'email')}>
              <Mail className="h-3 w-3 mr-1" />
              Email
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => onAddActivity(opportunity, 'meeting')}>
              <Calendar className="h-3 w-3 mr-1" />
              Meeting
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function FundraisingCRM() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingOpportunity, setEditingOpportunity] = useState(null)
  const [activityDialog, setActivityDialog] = useState({ open: false, opportunity: null, type: null })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    // Mock data for UI testing
    setOpportunities([
      {
        id: '1',
        stage: 'CONTACTED',
        rating: 4,
        notes: 'Initial meeting went well, discussing terms',
        updatedAt: new Date('2024-01-15'),
        investor: {
          name: 'John Investor',
          org: { name: 'VentureCapital Partners' }
        }
      },
      {
        id: '2',
        stage: 'MEETING',
        rating: 5,
        notes: 'Very interested, wants to see Q4 metrics',
        updatedAt: new Date('2024-01-14'),
        investor: {
          name: 'Sarah Partner',
          org: { name: 'HealthTech Capital' }
        }
      },
      {
        id: '3',
        stage: 'TO_CONTACT',
        rating: 3,
        notes: 'Warm intro from Alex',
        updatedAt: new Date('2024-01-13'),
        investor: {
          name: 'Mike Angel',
          org: { name: 'Early Stage Fund' }
        }
      }
    ])
    setLoading(false)
  }, [])

  const handleDragEnd = (event) => {
    const { active, over } = event
    
    if (!over) return

    const activeOpportunity = opportunities.find(opp => opp.id === active.id)
    const newStage = over.id

    if (activeOpportunity && activeOpportunity.stage !== newStage) {
      setOpportunities(prev => 
        prev.map(opp => 
          opp.id === active.id 
            ? { ...opp, stage: newStage, updatedAt: new Date() }
            : opp
        )
      )
    }
  }

  const getOpportunitiesByStage = (stage) => {
    return opportunities.filter(opp => opp.stage === stage)
  }

  const handleAddActivity = (opportunity, type) => {
    setActivityDialog({ open: true, opportunity, type })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fundraising CRM</h1>
          <p className="text-muted-foreground">
            Manage your investor relationships and track fundraising progress
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Opportunity
        </Button>
      </div>

      {/* CRM Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 overflow-x-auto">
          {PIPELINE_STAGES.map((stage) => {
            const stageOpportunities = getOpportunitiesByStage(stage.id)
            
            return (
              <div key={stage.id} className="min-w-[300px]">
                <div className={`p-3 rounded-lg ${stage.color} mb-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{stage.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {stageOpportunities.length}
                    </Badge>
                  </div>
                </div>
                
                <SortableContext items={stageOpportunities.map(opp => opp.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3 min-h-[200px]">
                    {stageOpportunities.map((opportunity) => (
                      <SortableOpportunity
                        key={opportunity.id}
                        opportunity={opportunity}
                        onEdit={setEditingOpportunity}
                        onAddActivity={handleAddActivity}
                      />
                    ))}
                    
                    {stageOpportunities.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Drop opportunities here
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            )
          })}
        </div>
      </DndContext>

      {/* Add Activity Dialog */}
      <Dialog open={activityDialog.open} onOpenChange={(open) => setActivityDialog({ ...activityDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {activityDialog.type} Activity</DialogTitle>
            <DialogDescription>
              Record your interaction with {activityDialog.opportunity?.investor.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Activity Type</Label>
              <Select value={activityDialog.type}>
                <SelectTrigger>
                  <SelectValue />
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
              <Textarea placeholder="What happened in this interaction?" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDialog({ open: false, opportunity: null, type: null })}>
              Cancel
            </Button>
            <Button>Save Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}