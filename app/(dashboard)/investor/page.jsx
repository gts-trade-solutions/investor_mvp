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
import { formatNumber } from '@/lib/utils'
import { Building2, Target, Users, TrendingUp } from 'lucide-react'

export default function InvestorDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalStartups: 0,
    myPipeline: 0,
    funds: 2,
    investors: 1,
    pipelineStages: [],
    recentOpportunities: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // 1) Count available startups (from founders)
        const { count: totalStartups, error: foundersError } = await supabase
          .from('founders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        if (foundersError) throw foundersError

        // 2) Get current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw authError

        // Defaults if not logged in
        let myPipeline = 0
        let pipelineStages = []
        let recentOpportunities = []

        if (user) {
          // 3) Load this investor's pipeline rows and join startups
          const { data: pipelineRows, error: pipelineError } = await supabase
            .from('investor_pipeline')
            .select(
              `
              id,
              stage,
              rating,
              updated_at,
              startup: startups (
                id,
                name,
                stage,
                country
              )
            `
            )
            .eq('investor_id', user.id)
            .order('updated_at', { ascending: false })

          if (pipelineError) throw pipelineError

          const rows = pipelineRows || []

          // 3a) My pipeline = total rows
          myPipeline = rows.length

          // 3b) Stage counts
          const stageCounts = rows.reduce((acc, row) => {
            const s = row.stage || 'UNKNOWN'
            acc[s] = (acc[s] || 0) + 1
            return acc
          }, {}) // 👈 plain JS object, no TS

          // Keep a consistent order for known stages
          const stageOrder = [
            'TO_CONTACT',
            'CONTACTED',
            'MEETING',
            'DILIGENCE',
            'COMMITTED',
            'LOST',
          ]

          pipelineStages = stageOrder
            .filter((s) => stageCounts[s])
            .map((s) => ({ stage: s, _count: stageCounts[s] }))

          // If there are any "unknown" stages not in the list, append them
          Object.entries(stageCounts).forEach(([stage, count]) => {
            if (!stageOrder.includes(stage)) {
              pipelineStages.push({ stage, _count: count })
            }
          })

          // 3c) Recent opportunities = latest few rows
          recentOpportunities = rows.slice(0, 5).map((row) => ({
            id: row.id,
            stage: row.stage,
            rating: row.rating ?? null,
            updatedAt: row.updated_at,
            startup: {
              name: row.startup?.name ?? 'Unknown startup',
              stage: row.startup?.stage ?? 'UNKNOWN',
              geo: row.startup?.country ?? '—',
            },
          }))
        }

        setDashboardData({
          totalStartups: totalStartups || 0,
          myPipeline,
          funds: 2, // still static for now
          investors: 1, // still static for now
          pipelineStages,
          recentOpportunities,
        })
      } catch (error) {
        console.error(
          'Error fetching investor dashboard:',
          error?.message || error
        )
        // If something fails, leave default zeros instead of crashing
        setDashboardData((prev) => ({
          ...prev,
          totalStartups: prev.totalStartups || 0,
        }))
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
          Welcome back, John Investor. Here&apos;s your investment overview.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Dynamic Available Startups */}
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

        {/* My Pipeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Pipeline</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.myPipeline}</div>
            <p className="text-xs text-muted-foreground">
              Startups you&apos;re tracking
            </p>
          </CardContent>
        </Card>

        {/* Active Funds (still static) */}
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

        {/* Investor Profiles (still static) */}
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
            <CardDescription>Breakdown of opportunities by stage</CardDescription>
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
                    {opportunity.updatedAt
                      ? new Date(opportunity.updatedAt).toLocaleDateString()
                      : ''}
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
