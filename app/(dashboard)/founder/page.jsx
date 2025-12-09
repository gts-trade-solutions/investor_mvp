'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { Building2, Users, Target, TrendingUp } from 'lucide-react'

export default function FounderDashboard() {
  const [dashboardData, setDashboardData] = useState({
    startups: 0,
    opportunities: 12,
    submissions: 8,
    totalViews: 247
  })
  const [loading, setLoading] = useState(true)

  // Static activities — no Supabase connection needed
  const recentActivities = [
    {
      id: '1',
      type: 'note',
      note: 'Initial meeting went well, discussing terms',
      createdAt: new Date('2024-01-15'),
      user: { name: 'Jane Founder' },
      opportunity: {
        startup: { name: 'AI Analytics Platform' },
        investor: { name: 'John Investor' }
      }
    },
    {
      id: '2',
      type: 'email',
      note: 'Sent updated pitch deck with Q3 metrics',
      createdAt: new Date('2024-01-14'),
      user: { name: 'Jane Founder' },
      opportunity: {
        startup: { name: 'HealthTech Solutions' },
        investor: { name: 'Sarah VC' }
      }
    },
    {
      id: '3',
      type: 'call',
      note: 'Follow-up call scheduled for next week',
      createdAt: new Date('2024-01-13'),
      user: { name: 'Jane Founder' },
      opportunity: {
        startup: { name: 'AI Analytics Platform' },
        investor: { name: 'Mike Capital' }
      }
    }
  ]

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // 🔹 Fetch count of active startups from founders table
        const { count, error } = await supabase
          .from('founders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active') // adjust column name if needed

        if (error) throw error

        // Update only the dynamic part (startups)
        setDashboardData((prev) => ({
          ...prev,
          startups: count || 0
        }))
      } catch (error) {
        console.error('Error fetching active startups:', error.message)
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
          Welcome back, Jane Founder. Here's your startup overview.
        </p>
      </div>

      {/* ===== Metrics Cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ✅ Dynamic Active Startups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Startups</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.startups}</div>
            <p className="text-xs text-muted-foreground">
              Companies in your portfolio
            </p>
          </CardContent>
        </Card>

        {/* Other cards unchanged */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.opportunities}</div>
            <p className="text-xs text-muted-foreground">
              Investor connections in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pitch Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.submissions}</div>
            <p className="text-xs text-muted-foreground">
              Decks shared with investors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deck Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.totalViews)}</div>
            <p className="text-xs text-muted-foreground">
              Across all your pitch decks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ===== Static Recent Activities ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates from your fundraising pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>
                    {' '}added a {activity.type} for{' '}
                    <span className="font-medium">{activity.opportunity.startup.name}</span>
                    {activity.opportunity.investor && (
                      <>
                        {' '}with{' '}
                        <span className="font-medium">{activity.opportunity.investor.name}</span>
                      </>
                    )}
                  </p>
                  {activity.note && (
                    <p className="text-xs text-muted-foreground mt-1">{activity.note}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
