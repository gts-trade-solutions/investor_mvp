'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Building2, Users, Globe, TrendingUp, DollarSign, Calendar, FileText, Heart, Star, MessageCircle } from 'lucide-react'
import { formatCurrency, formatNumber, formatSector, formatStage, formatDate } from '@/lib/utils'

export default function StartupProfile({ params }) {
  const [startup, setStartup] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for UI testing
    setStartup({
      id: params.id,
      name: 'AI Analytics Platform',
      tagline: 'Transforming business intelligence with AI-powered insights',
      description: 'We help enterprises make data-driven decisions through our advanced AI analytics platform. Our solution processes millions of data points in real-time to provide actionable insights.',
      sector: ['FINTECH', 'ENTERPRISE'],
      stage: 'SEED',
      geo: 'US',
      website: 'https://aianalytics.com',
      founded: new Date('2022-01-15'),
      mrr: 50000,
      teamSize: 12,
      fundingRaised: 250000000, // $2.5M in cents
      fundingGoal: 500000000, // $5M in cents
      org: { name: 'TechStart Inc' },
      metrics: {
        revenue: 600000, // $6K monthly
        growth: 25, // 25% MoM
        customers: 45,
        retention: 92
      },
      team: [
        {
          name: 'Jane Founder',
          role: 'CEO & Co-founder',
          bio: 'Former VP of Engineering at Google, 10+ years in AI/ML',
          image: null
        },
        {
          name: 'John CTO',
          role: 'CTO & Co-founder', 
          bio: 'Ex-Tesla Senior Engineer, PhD in Computer Science',
          image: null
        }
      ],
      traction: [
        { metric: 'Monthly Revenue', value: '$6,000', change: '+25%' },
        { metric: 'Active Users', value: '1,200', change: '+40%' },
        { metric: 'Customer Retention', value: '92%', change: '+5%' },
        { metric: 'NPS Score', value: '68', change: '+12%' }
      ],
      updates: [
        {
          id: '1',
          title: 'Closed 3 Enterprise Deals',
          date: new Date('2024-01-15'),
          content: 'Excited to announce partnerships with Fortune 500 companies...'
        },
        {
          id: '2', 
          title: 'Product Launch Success',
          date: new Date('2024-01-10'),
          content: 'Our new dashboard has been well received by early customers...'
        }
      ]
    })
    setLoading(false)
  }, [params.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Startup Profile</h1>
          <p className="text-muted-foreground">Loading startup details...</p>
        </div>
      </div>
    )
  }

  if (!startup) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Startup Not Found</h1>
          <p className="text-muted-foreground">The startup you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{startup.name}</h1>
          <p className="text-lg text-muted-foreground mt-1">{startup.tagline}</p>
          <div className="flex items-center space-x-4 mt-3">
            <Badge variant="outline">{formatStage(startup.stage)}</Badge>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>{startup.geo}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Founded {startup.founded.getFullYear()}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button>
            <MessageCircle className="mr-2 h-4 w-4" />
            Express Interest
          </Button>
          <Button variant="outline">
            <Heart className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="outline">
            <Star className="mr-2 h-4 w-4" />
            Rate
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(startup.mrr)}</div>
            <p className="text-xs text-green-600">+{startup.metrics.growth}% MoM</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{startup.teamSize}</div>
            <p className="text-xs text-muted-foreground">Full-time employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{startup.metrics.customers}</div>
            <p className="text-xs text-muted-foreground">{startup.metrics.retention}% retention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Funding Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(startup.fundingRaised)}</div>
            <Progress value={(startup.fundingRaised / startup.fundingGoal) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(startup.fundingGoal)} goal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="traction">Traction</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="deck">Pitch Deck</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {startup.description}
                  </p>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Focus Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {startup.sector.map((sector) => (
                        <Badge key={sector} variant="secondary">
                          {formatSector(sector)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {startup.website && (
                    <div className="mt-4">
                      <a
                        href={startup.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit Website →
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Organization</p>
                    <p className="text-sm text-muted-foreground">{startup.org.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Stage</p>
                    <p className="text-sm text-muted-foreground">{formatStage(startup.stage)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{startup.geo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Founded</p>
                    <p className="text-sm text-muted-foreground">{formatDate(startup.founded)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {startup.team.map((member, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-medium">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="traction">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {startup.traction.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{item.metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <p className={`text-xs ${item.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {item.change} from last month
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="updates">
          <div className="space-y-4">
            {startup.updates.map((update) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{update.title}</CardTitle>
                      <CardDescription>{formatDate(update.date)}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{update.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deck">
          <Card>
            <CardHeader>
              <CardTitle>Pitch Deck Preview</CardTitle>
              <CardDescription>
                Request access to view the full pitch deck
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Pitch deck access is restricted to interested investors
              </p>
              <Button>Request Deck Access</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}