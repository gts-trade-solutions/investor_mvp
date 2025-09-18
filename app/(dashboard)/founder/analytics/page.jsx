'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Download, Users, TrendingUp, FileText, Clock } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/utils'

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for UI testing
    setAnalytics({
      totalViews: 247,
      totalDownloads: 89,
      uniqueViewers: 34,
      avgViewTime: 180, // seconds
      topDecks: [
        {
          id: '1',
          name: 'Series A Pitch Deck',
          views: 89,
          downloads: 23,
          avgViewTime: 240,
          lastViewed: new Date('2024-01-15')
        },
        {
          id: '2',
          name: 'Product Demo Deck',
          views: 67,
          downloads: 18,
          avgViewTime: 195,
          lastViewed: new Date('2024-01-14')
        },
        {
          id: '3',
          name: 'Financial Projections',
          views: 45,
          downloads: 12,
          avgViewTime: 156,
          lastViewed: new Date('2024-01-13')
        }
      ],
      recentViews: [
        {
          id: '1',
          deckName: 'Series A Pitch Deck',
          viewerEmail: 'investor@vc.com',
          viewTime: 320,
          pagesViewed: 12,
          timestamp: new Date('2024-01-15T14:30:00')
        },
        {
          id: '2',
          deckName: 'Product Demo Deck',
          viewerEmail: 'partner@fund.com',
          viewTime: 180,
          pagesViewed: 8,
          timestamp: new Date('2024-01-15T11:20:00')
        },
        {
          id: '3',
          deckName: 'Financial Projections',
          viewerEmail: 'analyst@capital.com',
          viewTime: 95,
          pagesViewed: 5,
          timestamp: new Date('2024-01-14T16:45:00')
        }
      ]
    })
    setLoading(false)
  }, [])

  const formatViewTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

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
          Track engagement with your pitch decks and investor interest
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalViews)}</div>
            <p className="text-xs text-muted-foreground">
              Across all pitch decks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalDownloads)}</div>
            <p className="text-xs text-muted-foreground">
              Total file downloads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueViewers}</div>
            <p className="text-xs text-muted-foreground">
              Individual investors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. View Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatViewTime(analytics.avgViewTime)}</div>
            <p className="text-xs text-muted-foreground">
              Per deck session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Decks */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Decks</CardTitle>
          <CardDescription>
            Your most viewed and downloaded pitch decks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topDecks.map((deck, index) => (
              <div key={deck.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <span className="text-sm font-medium text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-medium">{deck.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Last viewed {formatDate(deck.lastViewed)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{deck.views}</div>
                    <div className="text-muted-foreground">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{deck.downloads}</div>
                    <div className="text-muted-foreground">Downloads</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{formatViewTime(deck.avgViewTime)}</div>
                    <div className="text-muted-foreground">Avg. Time</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Viewing Activity</CardTitle>
          <CardDescription>
            Latest interactions with your pitch decks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentViews.map((view) => (
              <div key={view.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">{view.deckName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Viewed by {view.viewerEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div>{formatViewTime(view.viewTime)}</div>
                  <div>{view.pagesViewed} pages</div>
                  <div>{formatDate(view.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}