'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, MessageCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { RequestIntroDialog } from '@/components/founder/request-intro-dialog'

export default function Introductions() {
  const [intros, setIntros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for UI testing
    setIntros([
      {
        id: '1',
        fromUser: { name: 'Sarah Connector', email: 'sarah@network.com' },
        toUser: { name: 'John Investor', email: 'john@vc.com' },
        startup: { name: 'AI Analytics Platform' },
        status: 'REQUESTED',
        createdAt: new Date('2024-01-15'),
        message: 'Would love to connect you with John who invests in AI startups at the seed stage.'
      },
      {
        id: '2',
        fromUser: { name: 'Mike Mentor', email: 'mike@advisor.com' },
        toUser: { name: 'Lisa Partner', email: 'lisa@fund.com' },
        startup: { name: 'HealthTech Solutions' },
        status: 'SENT',
        createdAt: new Date('2024-01-12'),
        message: 'Lisa has been looking for healthtech investments. Perfect timing!'
      },
      {
        id: '3',
        fromUser: { name: 'David Angel', email: 'david@angels.com' },
        toUser: { name: 'Emma Investor', email: 'emma@capital.com' },
        startup: { name: 'CleanTech Innovations' },
        status: 'COMPLETED',
        createdAt: new Date('2024-01-08'),
        message: 'Emma loves cleantech and has been actively investing in the space.'
      },
      {
        id: '4',
        fromUser: { name: 'Alex Founder', email: 'alex@startup.com' },
        toUser: { name: 'Robert VC', email: 'robert@ventures.com' },
        startup: { name: 'AI Analytics Platform' },
        status: 'DECLINED',
        createdAt: new Date('2024-01-05'),
        message: 'Robert might be interested in your AI approach.'
      }
    ])
    setLoading(false)
  }, [])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="mr-1 h-3 w-3" />
            Requested
          </Badge>
        )
      case 'SENT':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <MessageCircle className="mr-1 h-3 w-3" />
            Sent
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )
      case 'DECLINED':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="mr-1 h-3 w-3" />
            Declined
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Introductions</h1>
          <p className="text-muted-foreground">Loading introductions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Introductions</h1>
          <p className="text-muted-foreground">
            Request warm introductions to investors through your network
          </p>
        </div>
        <RequestIntroDialog />
      </div>

      {/* Introduction Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {intros.filter(i => i.status === 'REQUESTED').length}
            </div>
            <div className="text-sm text-muted-foreground">Requested</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {intros.filter(i => i.status === 'SENT').length}
            </div>
            <div className="text-sm text-muted-foreground">Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {intros.filter(i => i.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {intros.filter(i => i.status === 'DECLINED').length}
            </div>
            <div className="text-sm text-muted-foreground">Declined</div>
          </CardContent>
        </Card>
      </div>

      {/* Introductions List */}
      <div className="space-y-4">
        {intros.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No introduction requests yet.</p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Request Your First Introduction
              </Button>
            </CardContent>
          </Card>
        ) : (
          intros.map((intro) => (
            <Card key={intro.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Introduction to {intro.toUser.name}
                    </CardTitle>
                    <CardDescription>
                      Requested from {intro.fromUser.name} • {formatDate(intro.createdAt)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(intro.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">From:</p>
                    <p className="text-muted-foreground">
                      {intro.fromUser.name} ({intro.fromUser.email})
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">To:</p>
                    <p className="text-muted-foreground">
                      {intro.toUser.name} ({intro.toUser.email})
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-sm mb-1">Startup:</p>
                  <p className="text-muted-foreground text-sm">{intro.startup.name}</p>
                </div>

                <div>
                  <p className="font-medium text-sm mb-1">Message:</p>
                  <p className="text-muted-foreground text-sm">{intro.message}</p>
                </div>

                {intro.status === 'REQUESTED' && (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      Follow Up
                    </Button>
                    <Button size="sm" variant="outline">
                      Cancel Request
                    </Button>
                  </div>
                )}

                {intro.status === 'COMPLETED' && (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      View Connection
                    </Button>
                    <Button size="sm" variant="outline">
                      Send Thank You
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}