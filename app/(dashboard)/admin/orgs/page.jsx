'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, MoreHorizontal, Building2, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AdminOrgs() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Mock data for UI testing
    setOrgs([
      {
        id: '1',
        name: 'TechStart Inc',
        slug: 'techstart-inc',
        createdAt: new Date('2024-01-15'),
        memberCount: 5,
        startupCount: 2,
        type: 'startup'
      },
      {
        id: '2',
        name: 'VentureCapital Partners',
        slug: 'vc-partners',
        createdAt: new Date('2024-01-10'),
        memberCount: 8,
        fundCount: 3,
        type: 'investor'
      },
      {
        id: '3',
        name: 'InvestMatch Platform',
        slug: 'investmatch-platform',
        createdAt: new Date('2024-01-01'),
        memberCount: 3,
        type: 'platform'
      }
    ])
    setLoading(false)
  }, [])

  const getTypeBadge = (type) => {
    const colors = {
      startup: 'bg-blue-100 text-blue-800',
      investor: 'bg-green-100 text-green-800',
      platform: 'bg-purple-100 text-purple-800'
    }
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage companies, funds, and other organizations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search organizations..."
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

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orgs.map((org) => (
          <Card key={org.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <CardDescription>/{org.slug}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                {getTypeBadge(org.type)}
                <span className="text-sm text-muted-foreground">
                  {org.memberCount} members
                </span>
              </div>

              {org.startupCount && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Startups: </span>
                  <span className="font-medium">{org.startupCount}</span>
                </div>
              )}

              {org.fundCount && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Funds: </span>
                  <span className="font-medium">{org.fundCount}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Created {formatDate(org.createdAt)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}