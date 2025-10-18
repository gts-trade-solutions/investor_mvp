'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Building2, Target, Award } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for UI testing
    setAnalytics({
      userGrowth: {
        total: 1247,
        thisMonth: 89,
        lastMonth: 67,
        growth: 32.8
      },
      orgGrowth: {
        total: 89,
        thisMonth: 12,
        lastMonth: 8,
        growth: 50.0
      },
      opportunityMetrics: {
        total: 789,
        active: 234,
        closed: 45,
        conversionRate: 19.2
      },
      platformActivity: {
        dailyActiveUsers: 156,
        weeklyActiveUsers: 423,
        monthlyActiveUsers: 891
      }
    })
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Platform performance metrics and insights
        </p>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Growth</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.userGrowth.total)}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.userGrowth.thisMonth} this month ({analytics.userGrowth.growth}% growth)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization Growth</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.orgGrowth.total)}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.orgGrowth.thisMonth} this month ({analytics.orgGrowth.growth}% growth)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.opportunityMetrics.active)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.opportunityMetrics.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.platformActivity.monthlyActiveUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(analytics.platformActivity.weeklyActiveUsers)} weekly active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>
              User engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Daily Active Users</span>
              <span className="text-2xl font-bold">{formatNumber(analytics.platformActivity.dailyActiveUsers)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Weekly Active Users</span>
              <span className="text-2xl font-bold">{formatNumber(analytics.platformActivity.weeklyActiveUsers)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Monthly Active Users</span>
              <span className="text-2xl font-bold">{formatNumber(analytics.platformActivity.monthlyActiveUsers)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opportunity Metrics</CardTitle>
            <CardDescription>
              Investment pipeline performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Opportunities</span>
              <span className="text-2xl font-bold">{formatNumber(analytics.opportunityMetrics.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Opportunities</span>
              <span className="text-2xl font-bold">{formatNumber(analytics.opportunityMetrics.active)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Closed Deals</span>
              <span className="text-2xl font-bold">{formatNumber(analytics.opportunityMetrics.closed)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className="text-2xl font-bold">{analytics.opportunityMetrics.conversionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}