// app/founder/updates/page.jsx
'use client'

import React, { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Archive, Edit, MessageCircle, Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ComposeUpdateDialog } from '@/components/founder/compose-update-dialog'

function getStatusBadge(status) {
  switch (status) {
    case 'sent':
      return <Badge variant="default">Sent</Badge>
    case 'draft':
      return <Badge variant="secondary">Draft</Badge>
    case 'archived':
      return <Badge variant="outline">Archived</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

export default function FounderUpdatesPage() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadUpdates() {
      try {
        setLoading(true)

        // 🔴 get current user (founder)
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        console.log('auth.getUser result:', { user, authError })
        if (authError) throw authError
        if (!user) {
          // if not logged in, send to sign-in
          window.location.href = '/auth/signin'
          return
        }

        const { data, error } = await supabase
          .from('investor_updates')
          .select(
            `
            id,
            subject,
            body,
            status,
            created_at,
            founder_id,
            investor_update_recipients ( id )
          `
          )
          .eq('founder_id', user.id)  // 👈 match what we insert
          .order('created_at', { ascending: false })

        console.log('select investor_updates result:', { data, error })
        if (error) throw error

        if (!cancelled) {
          const mapped = (data || []).map((row) => ({
            id: row.id,
            subject: row.subject,
            body: row.body,
            status: row.status || 'sent',
            createdAt: row.created_at
              ? new Date(row.created_at)
              : new Date(),
            recipientsCount: Array.isArray(row.investor_update_recipients)
              ? row.investor_update_recipients.length
              : 0,
          }))
          setUpdates(mapped)
        }
      } catch (err) {
        console.error('Error loading investor updates:', err)
        if (!cancelled) setUpdates([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUpdates()
    return () => {
      cancelled = true
    }
  }, [])

  const handleArchive = async (update) => {
    try {
      const { error } = await supabase
        .from('investor_updates')
        .update({ status: 'archived' })
        .eq('id', update.id)

      if (error) throw error

      setUpdates((prev) =>
        prev.map((u) =>
          u.id === update.id ? { ...u, status: 'archived' } : u
        )
      )
    } catch (err) {
      console.error('Error archiving update:', err)
      alert('Failed to archive update')
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

        <ComposeUpdateDialog
          onCreated={(newUpdate) =>
            setUpdates((prev) => [newUpdate, ...prev])
          }
        />
      </div>

      <div className="space-y-4">
        {updates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No investor updates yet.
              </p>
              <ComposeUpdateDialog
                onCreated={(newUpdate) =>
                  setUpdates((prev) => [newUpdate, ...prev])
                }
              />
            </CardContent>
          </Card>
        ) : (
          updates.map((update) => (
            <Card
              key={update.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {update.subject}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(update.createdAt)}
                      {update.recipientsCount > 0 && (
                        <>
                          {' • Sent to '}
                          {update.recipientsCount} investors
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(update.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={update.status !== 'draft'}
                      title="Edit (not wired yet)"
                    >
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
                      <Button
                        size="sm"
                        onClick={() =>
                          alert('Send draft logic not implemented')
                        }
                      >
                        <Send className="mr-2 h-3 w-3" />
                        Send Update
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          alert('Edit draft logic not implemented')
                        }
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          alert('View details logic not implemented')
                        }
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArchive(update)}
                        disabled={update.status === 'archived'}
                      >
                        <Archive className="mr-2 h-3 w-3" />
                        {update.status === 'archived'
                          ? 'Archived'
                          : 'Archive'}
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
