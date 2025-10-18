'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MoreHorizontal } from 'lucide-react'
import { formatDate, formatStage } from '@/lib/utils'

const PIPELINE_STAGES = [
  { key: 'TO_CONTACT', label: 'To Contact', color: 'bg-gray-100 text-gray-800' },
  { key: 'CONTACTED', label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
  { key: 'MEETING', label: 'Meeting', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'DILIGENCE', label: 'Due Diligence', color: 'bg-purple-100 text-purple-800' },
  { key: 'COMMITTED', label: 'Committed', color: 'bg-green-100 text-green-800' },
  { key: 'LOST', label: 'Lost', color: 'bg-red-100 text-red-800' }
]

export default function InvestorPipeline() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/opportunities')
      if (response.ok) {
        const data = await response.json()
        setOpportunities(data.opportunities || [])
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOpportunitiesByStage = (stage) => {
    return opportunities.filter(opp => opp.stage === stage)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investment Pipeline</h1>
          <p className="text-muted-foreground">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investment Pipeline</h1>
          <p className="text-muted-foreground">
            Track your investment opportunities and deal flow
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Opportunity
        </Button>
      </div>

      {/* Pipeline Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 overflow-x-auto">
        {PIPELINE_STAGES.map((stage) => {
          const stageOpportunities = getOpportunitiesByStage(stage.key)
          
          return (
            <div key={stage.key} className="min-w-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <Badge variant="secondary" className="text-xs">
                  {stageOpportunities.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {stageOpportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm">{opportunity.startup?.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {formatStage(opportunity.startup?.stage)} • {opportunity.startup?.geo}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {stageOpportunities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No opportunities in this stage
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}