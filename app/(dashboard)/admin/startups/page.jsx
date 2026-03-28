'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, MoreHorizontal, Building2 } from 'lucide-react'
import { formatCurrency, formatSector, formatStage, formatDate } from '@/lib/utils'

export default function AdminStartups() {
  const [startups, setStartups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Mock data for UI testing
    setStartups([
      {
        id: '1',
        name: 'AI Analytics Platform',
        sector: ['FINTECH', 'ENTERPRISE'],
        stage: 'SEED',
        geo: 'US',
        mrr: 50000,
        teamSize: 12,
        isVisible: true,
        createdAt: new Date('2024-01-15'),
        org: { name: 'TechStart Inc' }
      },
      {
        id: '2',
        name: 'HealthTech Solutions',
        sector: ['HEALTHTECH'],
        stage: 'SERIES_A',
        geo: 'EU',
        mrr: 150000,
        teamSize: 25,
        isVisible: true,
        createdAt: new Date('2024-01-10'),
        org: { name: 'MedTech Corp' }
      },
      {
        id: '3',
        name: 'CleanTech Innovations',
        sector: ['CLEANTECH'],
        stage: 'PRE_SEED',
        geo: 'US',
        mrr: 15000,
        teamSize: 8,
        isVisible: false,
        createdAt: new Date('2024-01-05'),
        org: { name: 'Green Ventures' }
      }
    ])
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Startups</h1>
          <p className="text-muted-foreground">Loading startups...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Startups</h1>
          <p className="text-muted-foreground">
            Manage all startups on the platform
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search startups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Startups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {startups.map((startup) => (
          <Card key={startup.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{startup.name}</CardTitle>
                  <CardDescription>{startup.org?.name}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {!startup.isVisible && (
                    <Badge variant="secondary">Hidden</Badge>
                  )}
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Stage:</span>
                <Badge variant="outline">{formatStage(startup.stage)}</Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Location:</span>
                <span>{startup.geo}</span>
              </div>

              {startup.mrr && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">MRR:</span>
                  <span className="font-medium">{formatCurrency(startup.mrr)}</span>
                </div>
              )}

              {startup.teamSize && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Team:</span>
                  <span>{startup.teamSize} people</span>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Sectors</p>
                <div className="flex flex-wrap gap-1">
                  {startup.sector.slice(0, 2).map((sector) => (
                    <Badge key={sector} variant="secondary" className="text-xs">
                      {formatSector(sector)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Created {formatDate(startup.createdAt)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}