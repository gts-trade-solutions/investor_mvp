'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Zap, Target, MapPin, Building2, Star, TrendingUp } from 'lucide-react'
import { formatCurrency, formatSector, formatStage } from '@/lib/utils'

export default function SmartMatching() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for UI testing
    setMatches([
      {
        id: '1',
        investor: {
          name: 'John Investor',
          title: 'Partner',
          org: { name: 'VentureCapital Partners' },
          fund: {
            name: 'Early Stage Fund',
            checkSizeMin: 50000000,
            checkSizeMax: 500000000
          }
        },
        matchScore: 92,
        matchReasons: [
          'Invests in Fintech (your sector)',
          'Focuses on Seed stage',
          'Active in US market',
          'Recently invested in similar companies'
        ],
        sectors: ['FINTECH', 'ENTERPRISE'],
        stages: ['SEED', 'SERIES_A'],
        geos: ['US', 'EU']
      },
      {
        id: '2',
        investor: {
          name: 'Sarah Partner',
          title: 'Managing Partner',
          org: { name: 'HealthTech Capital' },
          fund: {
            name: 'MedTech Fund II',
            checkSizeMin: 100000000,
            checkSizeMax: 1000000000
          }
        },
        matchScore: 78,
        matchReasons: [
          'Invests in Enterprise software',
          'Geographic overlap (US)',
          'Check size matches your needs'
        ],
        sectors: ['HEALTHTECH', 'ENTERPRISE'],
        stages: ['SERIES_A', 'SERIES_B'],
        geos: ['US']
      }
    ])
    setLoading(false)
  }, [])

  const getMatchColor = (score) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Smart Matching</h1>
          <p className="text-muted-foreground">Loading matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Zap className="mr-3 h-8 w-8 text-primary" />
          Smart Matching
        </h1>
        <p className="text-muted-foreground">
          AI-powered investor recommendations based on your startup profile
        </p>
      </div>

      {/* Matching Algorithm Info */}
      <Card>
        <CardHeader>
          <CardTitle>How We Match You</CardTitle>
          <CardDescription>
            Our algorithm considers multiple factors to find the best investors for your startup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Target className="mx-auto h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium">Sector Focus</h4>
              <p className="text-sm text-muted-foreground">Investment thesis alignment</p>
            </div>
            <div className="text-center">
              <TrendingUp className="mx-auto h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium">Stage Match</h4>
              <p className="text-sm text-muted-foreground">Funding stage preferences</p>
            </div>
            <div className="text-center">
              <MapPin className="mx-auto h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium">Geography</h4>
              <p className="text-sm text-muted-foreground">Regional investment focus</p>
            </div>
            <div className="text-center">
              <Building2 className="mx-auto h-8 w-8 text-primary mb-2" />
              <h4 className="font-medium">Check Size</h4>
              <p className="text-sm text-muted-foreground">Investment amount fit</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matched Investors */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Top Matches</h2>
        {matches.map((match) => (
          <Card key={match.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{match.investor.name}</CardTitle>
                  <CardDescription>
                    {match.investor.title} at {match.investor.org.name}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getMatchColor(match.matchScore)}`}>
                    {match.matchScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Match Score</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={match.matchScore} className="w-full" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Fund Details</h4>
                  <p className="text-sm text-muted-foreground mb-1">
                    {match.investor.fund.name}
                  </p>
                  <p className="text-sm">
                    {formatCurrency(match.investor.fund.checkSizeMin)} - {formatCurrency(match.investor.fund.checkSizeMax)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Why This Match?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {match.matchReasons.slice(0, 3).map((reason, index) => (
                      <li key={index} className="flex items-center">
                        <Star className="h-3 w-3 text-primary mr-2" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium mb-1">Focus Sectors</p>
                  <div className="flex flex-wrap gap-1">
                    {match.sectors.map((sector) => (
                      <Badge key={sector} variant="secondary" className="text-xs">
                        {formatSector(sector)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Investment Stages</p>
                  <div className="flex flex-wrap gap-1">
                    {match.stages.map((stage) => (
                      <Badge key={stage} variant="outline" className="text-xs">
                        {formatStage(stage)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button className="flex-1">Connect</Button>
                <Button variant="outline" className="flex-1">Send Pitch</Button>
                <Button variant="outline">Save</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}