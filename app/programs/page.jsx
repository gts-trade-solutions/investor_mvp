'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Award, Calendar, Users, MapPin } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function ProgramsList() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Mock data for UI testing
    setPrograms([
      {
        id: '1',
        title: 'Early Stage Accelerator',
        description: 'A 12-week intensive program for early-stage startups with mentorship, funding, and networking opportunities.',
        tags: ['accelerator', 'mentorship', 'funding'],
        applicationDeadline: new Date('2024-02-15'),
        startDate: new Date('2024-03-01'),
        duration: '12 weeks',
        location: 'San Francisco, CA',
        applicationCount: 245,
        acceptanceRate: 5,
        funding: '$100K + $500K follow-on',
        status: 'accepting_applications',
        organizer: 'TechStart Ventures'
      },
      {
        id: '2',
        title: 'HealthTech Innovation Challenge',
        description: 'Competition for healthcare technology startups focusing on digital health solutions and medical devices.',
        tags: ['competition', 'healthtech', 'innovation'],
        applicationDeadline: new Date('2024-03-01'),
        startDate: new Date('2024-03-15'),
        duration: '8 weeks',
        location: 'Boston, MA',
        applicationCount: 156,
        acceptanceRate: 10,
        funding: '$50K prize pool',
        status: 'accepting_applications',
        organizer: 'HealthTech Capital'
      },
      {
        id: '3',
        title: 'Fintech Bootcamp 2024',
        description: 'Intensive program for fintech startups focusing on regulatory compliance, scaling, and partnerships.',
        tags: ['bootcamp', 'fintech', 'intensive'],
        applicationDeadline: new Date('2024-04-01'),
        startDate: new Date('2024-04-15'),
        duration: '6 weeks',
        location: 'New York, NY',
        applicationCount: 89,
        acceptanceRate: 15,
        funding: 'Up to $250K investment',
        status: 'upcoming',
        organizer: 'Fintech Ventures'
      }
    ])
    setLoading(false)
  }, [])

  const getStatusBadge = (status) => {
    const colors = {
      accepting_applications: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      accepting_applications: 'Accepting Applications',
      upcoming: 'Upcoming',
      in_progress: 'In Progress',
      completed: 'Completed'
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(search.toLowerCase()) ||
    program.description.toLowerCase().includes(search.toLowerCase()) ||
    program.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Programs & Competitions</h1>
          <p className="text-muted-foreground">Loading programs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Programs & Competitions</h1>
          <p className="text-muted-foreground">
            Discover accelerators, competitions, and programs to grow your startup
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search programs..."
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

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <Card key={program.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Award className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{program.title}</CardTitle>
                      <CardDescription>{program.organizer}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(program.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {program.description}
                </p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatDate(program.applicationDeadline)}</p>
                      <p className="text-muted-foreground text-xs">Application Deadline</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{program.applicationCount}</p>
                      <p className="text-muted-foreground text-xs">Applications</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{program.location}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{program.duration}</span>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Funding</p>
                  <p className="text-sm text-muted-foreground">{program.funding}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {program.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button asChild className="flex-1">
                    <Link href={`/programs/${program.id}`}>
                      View Details
                    </Link>
                  </Button>
                  {program.status === 'accepting_applications' && (
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/programs/${program.id}/apply`}>
                        Apply Now
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPrograms.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No programs found matching your search.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}