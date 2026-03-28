'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  Award,
  Users,
  Calendar,
  Plus,
  X,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function InvestorPrograms() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  // create-program UI state
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration: '',
    application_deadline: '',
    start_date: '',
    tags: '',
  })

  // ---------------- Fetch programs ----------------
  useEffect(() => {
    async function fetchPrograms() {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('investor_programs')
          .select('*')
          .order('application_deadline', { ascending: true })

        if (error) throw error

        const normalized = (data || []).map((p) => ({
          ...p,
          applicationDeadline: p.application_deadline
            ? new Date(p.application_deadline)
            : null,
          startDate: p.start_date ? new Date(p.start_date) : null,
          tags: Array.isArray(p.tags) ? p.tags : [],
        }))

        setPrograms(normalized)
      } catch (err) {
        console.error('Error fetching programs:', err)
        setError(err.message || 'Failed to load programs')
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  // ---------------- Helpers ----------------
  const getStatusBadge = (status) => {
    const colors = {
      accepting_applications: 'bg-green-100 text-green-800',
      upcoming: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      accepting_applications: 'Accepting Applications',
      upcoming: 'Upcoming',
      in_progress: 'In Progress',
      completed: 'Completed',
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const filteredPrograms = useMemo(() => {
    if (!search.trim()) return programs
    const term = search.toLowerCase()
    return programs.filter((p) => {
      const inTitle = p.title?.toLowerCase().includes(term)
      const inDesc = p.description?.toLowerCase().includes(term)
      const inTags = (p.tags || []).join(' ').toLowerCase().includes(term)
      return inTitle || inDesc || inTags
    })
  }, [programs, search])

  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  // ---------------- Create program ----------------
  async function handleCreateProgram(e) {
    e.preventDefault()
    try {
      setSaving(true)

      // get current authenticated user (investor)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) {
        throw new Error('You must be logged in to create a program.')
      }

      const tagsArray = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const { data, error } = await supabase
        .from('investor_programs')
        .insert([
          {
            title: form.title,
            description: form.description,
            duration: form.duration,
            application_deadline: form.application_deadline || null,
            start_date: form.start_date || null,
            tags: tagsArray,
            investor_id: user.id, // assumes column exists
            status: 'accepting_applications',
          },
        ])
        .select()
        .single()

      if (error) throw error

      const normalized = {
        ...data,
        applicationDeadline: data.application_deadline
          ? new Date(data.application_deadline)
          : null,
        startDate: data.start_date ? new Date(data.start_date) : null,
        tags: Array.isArray(data.tags) ? data.tags : [],
      }

      // Add to list
      setPrograms((prev) => [normalized, ...prev])

      // reset form
      setForm({
        title: '',
        description: '',
        duration: '',
        application_deadline: '',
        start_date: '',
        tags: '',
      })
      setShowForm(false)
    } catch (err) {
      console.error('Error creating program:', err)
      alert(err.message || 'Failed to create program')
    } finally {
      setSaving(false)
    }
  }

  // ---------------- Render states ----------------
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

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Programs</h1>
          <p className="text-red-500 text-sm">Error: {error}</p>
        </div>
      </div>
    )
  }

  // ---------------- Main UI ----------------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Programs</h1>
          <p className="text-muted-foreground">
            Accelerator programs and competitions for startups
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Program
        </Button>
      </div>

      {/* Create Program Form */}
      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Create Program</CardTitle>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateProgram}>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={form.title}
                  onChange={handleFormChange('title')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={handleFormChange('description')}
                  required
                  className="w-full border rounded-md bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Duration
                  </label>
                  <Input
                    placeholder="12 weeks"
                    value={form.duration}
                    onChange={handleFormChange('duration')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Application Deadline
                  </label>
                  <Input
                    type="date"
                    value={form.application_deadline}
                    onChange={handleFormChange('application_deadline')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={handleFormChange('start_date')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tags (comma separated)
                </label>
                <Input
                  placeholder="accelerator, fintech, remote"
                  value={form.tags}
                  onChange={handleFormChange('tags')}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Program'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
        {filteredPrograms.map((program) => (
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
                  {(program.tags || []).slice(0, 3).map((tag) => (
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
                    <p className="font-medium">
                      {program.application_count ?? 0}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Applications
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {program.applicationDeadline
                        ? formatDate(program.applicationDeadline)
                        : 'TBA'}
                    </p>
                    <p className="text-muted-foreground text-xs">Deadline</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                {/* View Details button navigates to /investor/programs/[id] */}
                <Button size="sm" className="flex-1" asChild>
                  <Link href={`/investor/programs/${program.id}`}>
                    View Details
                  </Link>
                </Button>

                {/* Manage button navigates to /investor/programs/[id]/manage */}
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <Link href={`/investor/programs/${program.id}/manage`}>
                    Manage
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No programs found for your search.
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Program
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
