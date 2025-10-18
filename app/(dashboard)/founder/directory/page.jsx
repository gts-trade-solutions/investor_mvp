'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Building2, DollarSign } from 'lucide-react'
import { formatCurrency, formatSector, formatStage } from '@/lib/utils'
import { InvestorFiltersDialog } from '@/components/founder/investor-filters-dialog'
import { SavedListsDropdown } from '@/components/founder/saved-lists-dropdown'
import { SendPitchDialog } from '@/components/founder/send-pitch-dialog'

// 🧠 Mock investor data (used when database has no data)
const MOCK_INVESTORS = [
  {
    id: 1,
    name: 'John Carter',
    title: 'Managing Partner',
    org: { name: 'Crescent Ventures' },
    fund: {
      checkSizeMin: 250000,
      checkSizeMax: 2000000
    },
    sectors: JSON.stringify(['AI', 'FinTech', 'HealthTech']),
    stages: JSON.stringify(['seed', 'series_a']),
    notes: 'Focused on early-stage technology companies building AI-driven tools for productivity.',
  },
  {
    id: 2,
    name: 'Priya Nair',
    title: 'Angel Investor',
    org: { name: 'Independent' },
    fund: {
      checkSizeMin: 50000,
      checkSizeMax: 250000
    },
    sectors: JSON.stringify(['EdTech', 'SaaS', 'CleanTech']),
    stages: JSON.stringify(['pre_seed', 'seed']),
    notes: 'Invests in startups with strong women founders and social impact goals.',
  },
  {
    id: 3,
    name: 'Michael Zhang',
    title: 'Partner',
    org: { name: 'BluePeak Capital' },
    fund: {
      checkSizeMin: 1000000,
      checkSizeMax: 5000000
    },
    sectors: JSON.stringify(['ClimateTech', 'Mobility', 'Energy']),
    stages: JSON.stringify(['series_a', 'series_b']),
    notes: 'Focuses on sustainability and clean energy transition projects globally.',
  },
]

export default function InvestorDirectory() {
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    sectors: [],
    stages: [],
    geos: [],
    checkSizeRange: [0, 10000000] // $0 to $10M
  })

  useEffect(() => {
    fetchInvestors()
  }, [search, filters])

  const fetchInvestors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(filters.sectors.length && { sectors: filters.sectors.join(',') }),
        ...(filters.stages.length && { stages: filters.stages.join(',') }),
        ...(filters.geos.length && { geos: filters.geos.join(',') }),
        ...(filters.checkSizeRange && { 
          checkSizeMin: filters.checkSizeRange[0],
          checkSizeMax: filters.checkSizeRange[1]
        })
      })

      const response = await fetch(`/api/investors?${params}`)
      if (response.ok) {
        const data = await response.json()
        // ✅ Use mock data if no investors found
        setInvestors(data.investors && data.investors.length > 0 ? data.investors : MOCK_INVESTORS)
      } else {
        // ✅ API error fallback
        setInvestors(MOCK_INVESTORS)
      }
    } catch (error) {
      console.error('Error fetching investors:', error)
      // ✅ Network or fetch failure fallback
      setInvestors(MOCK_INVESTORS)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investor Directory</h1>
          <p className="text-muted-foreground">Loading investors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investor Directory</h1>
        <p className="text-muted-foreground">
          Discover investors that match your startup's profile
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search investors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <InvestorFiltersDialog 
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
        <SavedListsDropdown />
      </div>

      {/* Investors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investors.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No investors found matching your criteria.</p>
          </div>
        ) : (
          investors.map((investor) => (
            <Card key={investor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{investor.name}</CardTitle>
                    <CardDescription>{investor.title}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <SendPitchDialog 
                      triggerButton={
                        <Button size="sm" variant="outline">
                          Send Pitch
                        </Button>
                      }
                      preselectedInvestors={[`${investor.name} - ${investor.org?.name}`]}
                    />
                    <Button size="sm">Connect</Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{investor.org?.name || 'Independent'}</span>
                </div>

                {investor.fund && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      {formatCurrency(investor.fund.checkSizeMin)} - {formatCurrency(investor.fund.checkSizeMax)}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium mb-1">Sectors</p>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(investor.sectors || '[]').slice(0, 3).map((sector) => (
                        <Badge key={sector} variant="secondary" className="text-xs">
                          {formatSector(sector)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Stages</p>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(investor.stages || '[]').slice(0, 3).map((stage) => (
                        <Badge key={stage} variant="outline" className="text-xs">
                          {formatStage(stage)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {investor.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {investor.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
