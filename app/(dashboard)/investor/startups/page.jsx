'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Globe, TrendingUp, Heart, Star } from 'lucide-react'
import { formatCurrency, formatSector, formatStage } from '@/lib/utils'

// 🧠 Mock data to display when no real startups are found
const MOCK_STARTUPS = [
  {
    id: 1,
    name: 'TechNova Labs',
    org: { name: 'TechNova Innovations' },
    stage: 'seed',
    geo: 'India',
    mrr: 15000,
    teamSize: 10,
    sector: JSON.stringify(['AI', 'SaaS', 'Analytics']),
    website: 'https://technova.ai',
  },
  {
    id: 2,
    name: 'GreenLoop Energy',
    org: { name: 'GreenLoop Pvt Ltd' },
    stage: 'series_a',
    geo: 'USA',
    mrr: 40000,
    teamSize: 25,
    sector: JSON.stringify(['CleanTech', 'IoT']),
    website: 'https://greenloop.com',
  },
  {
    id: 3,
    name: 'MediLink Health',
    org: { name: 'MediLink Healthcare' },
    stage: 'pre_seed',
    geo: 'UK',
    mrr: 8000,
    teamSize: 6,
    sector: JSON.stringify(['HealthTech', 'AI']),
    website: 'https://medilinkhealth.co.uk',
  },
]

export default function StartupsDirectory() {
  const [startups, setStartups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    sectors: [],
    stages: [],
    geos: []
  })

  useEffect(() => {
    fetchStartups()
  }, [search, filters])

  const fetchStartups = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(filters.sectors.length && { sectors: filters.sectors.join(',') }),
        ...(filters.stages.length && { stages: filters.stages.join(',') }),
        ...(filters.geos.length && { geos: filters.geos.join(',') })
      })

      const response = await fetch(`/api/startups?${params}`)
      if (response.ok) {
        const data = await response.json()
        // 🧩 If no startups in database, show mock data
        setStartups(data.startups && data.startups.length > 0 ? data.startups : MOCK_STARTUPS)
      } else {
        // 🧩 API failed, fallback to mock data
        setStartups(MOCK_STARTUPS)
      }
    } catch (error) {
      console.error('Error fetching startups:', error)
      setStartups(MOCK_STARTUPS)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Startup Directory</h1>
          <p className="text-muted-foreground">Loading startups...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Startup Directory</h1>
        <p className="text-muted-foreground">
          Discover promising startups seeking investment
        </p>
      </div>

      {/* 🔍 Search and Filters */}
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

      {/* 🧩 Startups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {startups.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No startups found matching your criteria.</p>
          </div>
        ) : (
          startups.map((startup) => (
            <Card key={startup.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{startup.name}</CardTitle>
                    <CardDescription>{startup.org?.name}</CardDescription>
                  </div>
                  <Button size="sm">View Details</Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{formatStage(startup.stage)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span>{startup.geo}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {startup.mrr && (
                    <div>
                      <p className="text-muted-foreground">MRR</p>
                      <p className="font-medium">{formatCurrency(startup.mrr)}</p>
                    </div>
                  )}
                  {startup.teamSize && (
                    <div>
                      <p className="text-muted-foreground">Team Size</p>
                      <p className="font-medium">{startup.teamSize} people</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Sectors</p>
                  <div className="flex flex-wrap gap-1">
                    {JSON.parse(startup.sector || '[]').slice(0, 3).map((sector) => (
                      <Badge key={sector} variant="secondary" className="text-xs">
                        {formatSector(sector)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1">
                    Express Interest
                  </Button>
                  <Button size="sm" variant="outline">
                    <Heart className="mr-2 h-3 w-3" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline">
                    <Star className="mr-2 h-3 w-3" />
                    Rate
                  </Button>
                </div>

                {startup.website && (
                  <div className="pt-2 border-t">
                    <a
                      href={startup.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Visit Website →
                    </a>
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
