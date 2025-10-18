'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Award, Users, Calendar, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function InvestorPrograms() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Mock data for UI testing
    setPrograms([
      {
        id: '1',
        title: 'Early Stage Accelerator',
        description: 'A 12-week program for early-stage startups with mentorship and funding opportunities',
        tags: ['accelerator', 'mentorship', 'funding'],
        applicationDeadline: new Date('2024-02-15'),
        startDate: new Date('2024-03-01'),
        duration: '12 weeks',
        applicationCount: 45,
        acceptedCount: 12,
        status: 'accepting_applications'
      },
      {
        id: '2',
        title: 'HealthTech Innovation Challenge',
        description: 'Competition for healthcare technology startups with $100K in prizes',
        tags: ['competition', 'healthtech', 'innovation'],
        applicationDeadline: new Date('2024-03-01'),
        startDate: new Date('2024-03-15'),
        duration: '8 weeks',
        applicationCount: 23,
        acceptedCount: 8,
        status: 'accepting_applications'
      },
      {
        id: '3',
        title: 'Fintech Bootcamp 2024',
        description: 'Intensive program for fintech startups focusing on regulatory compliance and scaling',
        tags: ['bootcamp', 'fintech', 'intensive'],
        applicationDeadline: new Date('2024-04-01'),
        startDate: new Date('2024-04-15'),
        duration: '6 weeks',
        applicationCount: 18,
        acceptedCount: 0,
        status: 'upcoming'
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Programs</h1>
          <p className="text-muted-foreground">Loading programs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Programs</h1>
          <p className="text-muted-foreground">
            Accelerator programs and competitions for startups
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Program
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
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
        {programs.map((program) => (
          <Card key={program.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Award className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{program.title}</CardTitle>
                    <CardDescription>{program.duration}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(program.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {program.description}
              </p>

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

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{program.applicationCount}</p>
                    <p className="text-muted-foreground text-xs">Applications</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{formatDate(program.applicationDeadline)}</p>
                    <p className="text-muted-foreground text-xs">Deadline</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button size="sm" className="flex-1">
                  View Details
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {programs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No programs available at the moment.</p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Program
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}