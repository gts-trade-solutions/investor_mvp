'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Award, Calendar, Users, MapPin, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function ProgramDetail({ params }) {
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for UI testing
    setProgram({
      id: params.id,
      title: 'Early Stage Accelerator',
      description: 'A 12-week intensive program for early-stage startups with mentorship, funding, and networking opportunities. Our program is designed to help founders build scalable businesses through expert guidance, peer learning, and access to capital.',
      longDescription: 'The Early Stage Accelerator is a comprehensive program that combines intensive mentorship, structured curriculum, and access to a network of successful entrepreneurs and investors. Over 12 weeks, selected startups will work closely with experienced mentors to refine their business models, develop go-to-market strategies, and prepare for fundraising.',
      tags: ['accelerator', 'mentorship', 'funding'],
      applicationDeadline: new Date('2024-02-15'),
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-05-24'),
      duration: '12 weeks',
      location: 'San Francisco, CA',
      applicationCount: 245,
      acceptanceRate: 5,
      funding: '$100K + $500K follow-on',
      equity: '6%',
      status: 'accepting_applications',
      organizer: 'TechStart Ventures',
      benefits: [
        '$100,000 initial investment',
        'Up to $500K follow-on funding',
        '1:1 mentorship with industry experts',
        'Access to investor network',
        'Legal and accounting support',
        'Office space in San Francisco',
        'Demo Day presentation',
        'Lifetime alumni network access'
      ],
      curriculum: [
        { week: 1, topic: 'Business Model Validation', description: 'Refine your value proposition and business model' },
        { week: 2, topic: 'Customer Discovery', description: 'Learn to identify and validate your target market' },
        { week: 3, topic: 'Product Development', description: 'Build and iterate on your MVP' },
        { week: 4, topic: 'Go-to-Market Strategy', description: 'Develop your sales and marketing approach' },
        { week: 8, topic: 'Fundraising Preparation', description: 'Prepare for Series A fundraising' },
        { week: 12, topic: 'Demo Day', description: 'Present to investors and celebrate graduation' }
      ],
      mentors: [
        {
          name: 'Sarah Johnson',
          role: 'Former VP of Product at Stripe',
          expertise: 'Product Strategy, Scaling'
        },
        {
          name: 'Michael Chen',
          role: 'Founder & CEO of DataCorp (acquired)',
          expertise: 'B2B Sales, Enterprise'
        },
        {
          name: 'Lisa Rodriguez',
          role: 'Partner at Growth Ventures',
          expertise: 'Fundraising, Venture Capital'
        }
      ],
      alumni: [
        { name: 'TechFlow', description: 'Workflow automation platform', outcome: 'Raised $10M Series A' },
        { name: 'DataInsights', description: 'Business intelligence tool', outcome: 'Acquired by Microsoft' },
        { name: 'HealthTrack', description: 'Digital health platform', outcome: 'Raised $5M Seed' }
      ],
      requirements: [
        'Pre-seed or seed stage startup',
        'Working prototype or MVP',
        'At least 2 co-founders',
        'Commitment to relocate to San Francisco',
        'Full-time dedication to the program'
      ]
    })
    setLoading(false)
  }, [params.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Program Details</h1>
          <p className="text-muted-foreground">Loading program details...</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Program Not Found</h1>
          <p className="text-muted-foreground">The program you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const daysUntilDeadline = Math.ceil((program.applicationDeadline - new Date()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Award className="mr-3 h-8 w-8 text-primary" />
              {program.title}
            </h1>
            <p className="text-lg text-muted-foreground mt-1">by {program.organizer}</p>
            <div className="flex items-center space-x-4 mt-3">
              <Badge variant="outline">{program.duration}</Badge>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{program.location}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(program.startDate)} - {formatDate(program.endDate)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            {program.status === 'accepting_applications' && (
              <div className="space-y-2">
                <Button asChild size="lg">
                  <Link href={`/programs/${program.id}/apply`}>
                    Apply Now
                  </Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Applications closed'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Investment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{program.funding}</div>
              <p className="text-xs text-muted-foreground">for {program.equity} equity</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{program.applicationCount}</div>
              <p className="text-xs text-muted-foreground">{program.acceptanceRate}% acceptance rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{program.duration}</div>
              <p className="text-xs text-muted-foreground">Intensive program</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Application Deadline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDate(program.applicationDeadline)}</div>
              <p className="text-xs text-muted-foreground">
                {daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Closed'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="mentors">Mentors</TabsTrigger>
            <TabsTrigger value="alumni">Alumni</TabsTrigger>
            <TabsTrigger value="apply">How to Apply</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>About the Program</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {program.longDescription}
                    </p>
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Program Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {program.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>What You Get</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {program.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="curriculum">
            <Card>
              <CardHeader>
                <CardTitle>12-Week Curriculum</CardTitle>
                <CardDescription>
                  Structured learning path designed to accelerate your startup's growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {program.curriculum.map((item, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-medium text-primary">{item.week}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{item.topic}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentors">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {program.mentors.map((mentor, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium">
                          {mentor.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{mentor.name}</CardTitle>
                        <CardDescription>{mentor.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      <strong>Expertise:</strong> {mentor.expertise}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="alumni">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Success Stories</CardTitle>
                  <CardDescription>
                    Alumni companies that have gone on to achieve significant milestones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {program.alumni.map((company, index) => (
                      <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{company.name}</h4>
                          <p className="text-sm text-muted-foreground">{company.description}</p>
                        </div>
                        <Badge variant="outline">{company.outcome}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="apply">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {program.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Application Process</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-medium">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Submit Application</p>
                        <p className="text-sm text-muted-foreground">Complete the online application form</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-medium">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Initial Review</p>
                        <p className="text-sm text-muted-foreground">Our team reviews your application</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-medium">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Interview</p>
                        <p className="text-sm text-muted-foreground">Video interview with our partners</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-medium">4</span>
                      </div>
                      <div>
                        <p className="font-medium">Final Decision</p>
                        <p className="text-sm text-muted-foreground">Notification within 2 weeks</p>
                      </div>
                    </div>
                  </div>
                  {program.status === 'accepting_applications' && (
                    <Button asChild className="w-full mt-6">
                      <Link href={`/programs/${program.id}/apply`}>
                        Start Application
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}