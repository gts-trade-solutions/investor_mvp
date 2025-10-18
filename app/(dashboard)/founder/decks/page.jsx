'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, FileText, Eye, Download, Share, MoreHorizontal } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/utils'

export default function PitchDecks() {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for UI testing
    setDecks([
      {
        id: '1',
        name: 'Series A Pitch Deck',
        createdAt: new Date('2024-01-15'),
        views: 47,
        downloads: 12,
        size: '2.4 MB',
        type: 'application/pdf'
      },
      {
        id: '2',
        name: 'Product Demo Deck',
        createdAt: new Date('2024-01-10'),
        views: 23,
        downloads: 8,
        size: '1.8 MB',
        type: 'application/pdf'
      },
      {
        id: '3',
        name: 'Financial Projections',
        createdAt: new Date('2024-01-05'),
        views: 15,
        downloads: 5,
        size: '890 KB',
        type: 'application/pdf'
      }
    ])
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pitch Decks</h1>
          <p className="text-muted-foreground">Loading pitch decks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pitch Decks</h1>
          <p className="text-muted-foreground">
            Manage your pitch decks and track engagement
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Upload Deck
        </Button>
      </div>

      {/* Decks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pitch decks uploaded yet.</p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Upload Your First Deck
            </Button>
          </div>
        ) : (
          decks.map((deck) => (
            <Card key={deck.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{deck.name}</CardTitle>
                      <CardDescription>{deck.size}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{formatNumber(deck.views)} views</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span>{deck.downloads} downloads</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Uploaded {formatDate(deck.createdAt)}
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="mr-2 h-3 w-3" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Share className="mr-2 h-3 w-3" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}