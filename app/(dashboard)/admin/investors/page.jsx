'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, MoreHorizontal, Users } from 'lucide-react'
import { formatCurrency, formatSector, formatStage, formatDate } from '@/lib/utils'

export default function AdminInvestors() {
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Mock data for UI testing
    setInvestors([
      {
        id: '1',
        name: 'John Investor',
        title: 'Partner',
        sectors: ['FINTECH', 'ENTERPRISE'],
        stages: ['SEED', 'SERIES_A'],
        geos: ['US', 'EU'],
        createdAt: new Date('2024-01-15'),
        org: { name: 'VentureCapital Partners' },
        fund: {
          name: 'Early Stage Ventures',
          checkSizeMin: 10000000,
          checkSizeMax: 500000000
        }
      },
      {
        id: '2',
        name: 'Sarah Partner',
        title: 'Managing Partner',
        sectors: ['HEALTHTECH', 'DEEPTECH'],
        stages: ['SERIES_A', 'SERIES_B'],
        geos: ['US'],
        createdAt: new Date('2024-01-10'),
        org: { name: 'HealthTech Capital' },
        fund: {
          name: 'MedTech Fund II',
          checkSizeMin: 50000000,
          checkSizeMax: 2000000000
        }
      }
    ])
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Investors</h1>
          <p className="text-muted-foreground">Loading investors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investors</h1>
          <p className="text-muted-foreground">
            Manage all investors on the platform
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search investors..."
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

      {/* Investors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investors.map((investor) => (
          <Card key={investor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{investor.name}</CardTitle>
                  <CardDescription>{investor.title}</CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Organization: </span>
                <span className="font-medium">{investor.org?.name}</span>
              </div>

              {investor.fund && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Fund: </span>
                  <span className="font-medium">{investor.fund.name}</span>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(investor.fund.checkSizeMin)} - {formatCurrency(investor.fund.checkSizeMax)}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Focus Sectors</p>
                <div className="flex flex-wrap gap-1">
                  {investor.sectors.slice(0, 3).map((sector) => (
                    <Badge key={sector} variant="secondary" className="text-xs">
                      {formatSector(sector)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Investment Stages</p>
                <div className="flex flex-wrap gap-1">
                  {investor.stages.slice(0, 3).map((stage) => (
                    <Badge key={stage} variant="outline" className="text-xs">
                      {formatStage(stage)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Joined {formatDate(investor.createdAt)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}