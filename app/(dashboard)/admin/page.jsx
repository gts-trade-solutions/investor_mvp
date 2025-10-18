'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { Users, Building2, Target, TrendingUp, FileText, Award } from 'lucide-react'

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 1247,
    totalOrgs: 89,
    totalStartups: 456,
    totalInvestors: 123,
    totalOpportunities: 789,
    totalPrograms: 12,
    recentSignups: 34,
    activeUsers: 156,
    usersByRole: [],
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for UI testing - replace with actual API calls when backend is ready
    const mockData = {
      totalUsers: 1247,
      totalOrgs: 89,
      totalStartups: 456,
      totalInvestors: 123,
      totalOpportunities: 789,
      totalPrograms: 12,
      recentSignups: 34,
      activeUsers: 156,
      usersByRole: [
        { role: 'FOUNDER', _count: 678 },
        { role: 'INVESTOR', _count: 234 },
        { role: 'ADMIN', _count: 5 }
      ],
      recentActivities: [
        {
          id: '1',
          type: 'note',
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
          createdAt: new Date('2024-01-14'),
          user: { name: 'Mike Startup' },
          opportunity: {
            startup: { name: 'HealthTech Solutions' },
            investor: { name: 'Sarah VC' }
          }
        },
        {
          id: '3',
          type: 'call',
          createdAt: new Date('2024-01-13'),
          user: { name: 'Lisa Entrepreneur' },
          opportunity: {
            startup: { name: 'CleanTech Innovations' },
            investor: { name: 'Green Capital' }
          }
        }
      ]
    }
    
    setDashboardData(mockData)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and management tools
        </p>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData.recentSignups} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.totalOrgs)}</div>
            <p className="text-xs text-muted-foreground">
              Active companies and funds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Startups</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.totalStartups)}</div>
            <p className="text-xs text-muted-foreground">
              Companies seeking funding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.activeUsers)}</div>
            <p className="text-xs text-muted-foreground">
              Active users this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.totalInvestors)}</div>
            <p className="text-xs text-muted-foreground">
              Investment professionals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.totalOpportunities)}</div>
            <p className="text-xs text-muted-foreground">
              Investment connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programs</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.totalPrograms)}</div>
            <p className="text-xs text-muted-foreground">
              Accelerators and competitions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{formatNumber(dashboardData.recentSignups)}</div>
            <p className="text-xs text-muted-foreground">
              New user signups this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>User Distribution</CardTitle>
          <CardDescription>
            Breakdown of users by role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {dashboardData.usersByRole.map((role) => (
              <div key={role.role} className="text-center">
                <div className="text-2xl font-bold">{role._count}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {role.role.toLowerCase()}s
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Platform Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
          <CardDescription>
            Latest activities across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.recentActivities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No recent activities
            </p>
          ) : (
            <div className="space-y-4">
              {dashboardData.recentActivities.map((activity) => (
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
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
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