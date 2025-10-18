'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, MoreHorizontal, Award, Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AdminPrograms() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Mock data for UI testing
    setPrograms([
      {
        id: '1',
        title: 'Early Stage Accelerator',
        description: 'A 12-week program for early-stage startups',
        tags: ['accelerator', 'mentorship', 'funding'],
        applicationDeadline: new Date('2024-02-15'),
        createdAt: new Date('2024-01-01'),
        applicationCount: 45,
        status: 'active'
      },
      {
        id: '2',
        title: 'HealthTech Innovation Challenge',
        description: 'Competition for healthcare technology startups',
        tags: ['competition', 'healthtech', 'innovation'],
        applicationDeadline: new Date('2024-03-01'),
        createdAt: new Date('2024-01-10'),
        applicationCount: 23,
        status: 'active'
      },
      {
        id: '3',
        title: 'Fintech Bootcamp 2023',
        description: 'Intensive program for fintech startups',
        tags: ['bootcamp', 'fintech', 'intensive'],
        applicationDeadline: new Date('2023-12-15'),
        createdAt: new Date('2023-11-01'),
        applicationCount: 67,
        status: 'completed'
      }
    ])
    setLoading(false)
  }, [])

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800'
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
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
            Manage accelerator programs and competitions
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
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(program.status)}
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
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
                <div>
                  <p className="text-muted-foreground">Applications</p>
                  <p className="font-medium">{program.applicationCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Deadline</p>
                  <p className="font-medium">{formatDate(program.applicationDeadline)}</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Created {formatDate(program.createdAt)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}