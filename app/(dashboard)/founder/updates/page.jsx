'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Send, Edit, Archive, MessageCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ComposeUpdateDialog } from '@/components/founder/compose-update-dialog'

export default function Updates() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for UI testing
    setUpdates([
      {
        id: '1',
        subject: 'Q4 2023 Investor Update',
        body: 'We had an incredible quarter with 150% revenue growth and 3 new enterprise clients...',
        createdAt: new Date('2024-01-15'),
        status: 'sent',
        recipients: 12
      },
      {
        id: '2',
        subject: 'Product Launch Announcement',
        body: 'Excited to announce the launch of our new AI-powered analytics dashboard...',
        createdAt: new Date('2024-01-10'),
        status: 'draft',
        recipients: 0
      },
      {
        id: '3',
        subject: 'Series A Fundraising Update',
        body: 'We are pleased to share that we have successfully closed our Series A round...',
        createdAt: new Date('2024-01-05'),
        status: 'sent',
        recipients: 25
      }
    ])
    setLoading(false)
  }, [])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default">Sent</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investor Updates</h1>
          <p className="text-muted-foreground">Loading updates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investor Updates</h1>
          <p className="text-muted-foreground">
            Keep your investors informed with regular updates
          </p>
        </div>
        <ComposeUpdateDialog />
      </div>

      {/* Updates List */}
      <div className="space-y-4">
        {updates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No investor updates yet.</p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Update
              </Button>
            </CardContent>
          </Card>
        ) : (
          updates.map((update) => (
            <Card key={update.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{update.subject}</CardTitle>
                    <CardDescription>
                      {formatDate(update.createdAt)}
                      {update.recipients > 0 && ` • Sent to ${update.recipients} recipients`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(update.status)}
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2 mb-4">
                  {update.body}
                </p>
                <div className="flex items-center space-x-2">
                  {update.status === 'draft' ? (
                    <>
                      <Button size="sm">
                        <Send className="mr-2 h-3 w-3" />
                        Send Update
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Archive className="mr-2 h-3 w-3" />
                        Archive
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}