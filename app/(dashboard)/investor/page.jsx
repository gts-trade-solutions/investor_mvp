'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { Building2, Target, Users, TrendingUp } from 'lucide-react'

export default function InvestorDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalStartups: 0, // 🔹 will load dynamically
    myPipeline: 23,
    funds: 2,
    investors: 1,
    pipelineStages: [],
    recentOpportunities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // 🔹 Fetch count of available (active) startups from founders table
        const { count, error } = await supabase
          .from('founders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active') // ✅ change this if your table uses another field (e.g., is_active)

        if (error) throw error

        // Keep all other data static for now
        const mockData = {
          totalStartups: count || 0, // dynamic value
          myPipeline: 23,
          funds: 2,
          investors: 1,
          pipelineStages: [
            { stage: 'TO_CONTACT', _count: 8 },
            { stage: 'CONTACTED', _count: 5 },
            { stage: 'MEETING', _count: 4 },
            { stage: 'DILIGENCE', _count: 3 },
            { stage: 'COMMITTED', _count: 2 },
            { stage: 'LOST', _count: 1 }
          ],
          recentOpportunities: [
            {
              id: '1',
              stage: 'MEETING',
              rating: 4,
              updatedAt: new Date('2024-01-15'),
              startup: {
                name: 'AI Analytics Platform',
                stage: 'SEED',
                geo: 'US'
              }
            },
            {
              id: '2',
              stage: 'DILIGENCE',
              rating: 5,
              updatedAt: new Date('2024-01-14'),
              startup: {
                name: 'HealthTech Solutions',
                stage: 'SERIES_A',
                geo: 'EU'
              }
            },
            {
              id: '3',
              stage: 'CONTACTED',
              rating: 3,
              updatedAt: new Date('2024-01-13'),
              startup: {
                name: 'CleanTech Innovations',
                stage: 'PRE_SEED',
                geo: 'US'
              }
            }
          ]
        }

        setDashboardData(mockData)
      } catch (error) {
        console.error('Error fetching available startups:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, John Investor. Here's your investment overview.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ✅ Dynamic Available Startups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Startups</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(dashboardData.totalStartups)}
            </div>
            <p className="text-xs text-muted-foreground">
              Active companies seeking investment
            </p>
          </CardContent>
        </Card>

        {/* Other cards unchanged */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Pipeline</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.myPipeline}</div>
            <p className="text-xs text-muted-foreground">
              Startups you're tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Funds</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.funds}</div>
            <p className="text-xs text-muted-foreground">
              Investment vehicles available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investor Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.investors}</div>
            <p className="text-xs text-muted-foreground">
              Your investor profiles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      {dashboardData.pipelineStages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Overview</CardTitle>
            <CardDescription>
              Breakdown of opportunities by stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {dashboardData.pipelineStages.map((stage) => (
                <div key={stage.stage} className="text-center">
                  <div className="text-2xl font-bold">{stage._count}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {stage.stage.replace('_', ' ').toLowerCase()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Opportunities</CardTitle>
          <CardDescription>
            Latest updates in your investment pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.recentOpportunities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No opportunities yet. Start by exploring available startups.
            </p>
          ) : (
            <div className="space-y-4">
              {dashboardData.recentOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{opportunity.startup.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {opportunity.startup.stage} • {opportunity.startup.geo}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            opportunity.stage === 'TO_CONTACT'
                              ? 'bg-gray-100 text-gray-800'
                              : opportunity.stage === 'CONTACTED'
                              ? 'bg-blue-100 text-blue-800'
                              : opportunity.stage === 'MEETING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : opportunity.stage === 'DILIGENCE'
                              ? 'bg-purple-100 text-purple-800'
                              : opportunity.stage === 'COMMITTED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {opportunity.stage.replace('_', ' ').toLowerCase()}
                      </span>
                      {opportunity.rating && (
                        <span className="text-xs text-muted-foreground">
                          ⭐ {opportunity.rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    {new Date(opportunity.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
