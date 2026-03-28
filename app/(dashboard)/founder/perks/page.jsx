'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Gift,
  ExternalLink,
  Star,
  DollarSign,
  Zap,
  Shield,
} from 'lucide-react'

export default function Perks() {
  const [perks, setPerks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchPerks() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/perks')
        const body = await res.json().catch(() => ({}))

        if (!res.ok) {
          // show the real API error if your route sends { error: '...' }
          throw new Error(body.error || 'Failed to load perks')
        }

        if (!Array.isArray(body)) {
          console.error('Unexpected API response:', body)
          setPerks([])
          return
        }

        setPerks(body)
      } catch (err) {
        console.error('Error in fetchPerks:', err)
        setError(err.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchPerks()
  }, [])

  const getCategoryColor = (category) => {
    const colors = {
      Infrastructure: 'bg-blue-100 text-blue-800',
      Legal: 'bg-purple-100 text-purple-800',
      Payments: 'bg-green-100 text-green-800',
      Productivity: 'bg-yellow-100 text-yellow-800',
      'Sales & Marketing': 'bg-pink-100 text-pink-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getIcon = (icon) => {
    switch (icon) {
      case 'zap':
        return <Zap className="h-6 w-6" />
      case 'shield':
        return <Shield className="h-6 w-6" />
      case 'dollar':
        return <DollarSign className="h-6 w-6" />
      case 'star':
        return <Star className="h-6 w-6" />
      default:
        return <Gift className="h-6 w-6" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Startup Perks</h1>
          <p className="text-muted-foreground">Loading perks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Startup Perks</h1>
          <p className="text-red-500 text-sm">Error: {error}</p>
        </div>
      </div>
    )
  }

  const featuredPerks = perks.filter((perk) => perk.featured)
  const regularPerks = perks.filter((perk) => !perk.featured)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Startup Perks</h1>
        <p className="text-muted-foreground">
          Exclusive deals and credits to help your startup grow faster
        </p>
      </div>

      {/* Featured Perks */}
      {featuredPerks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Star className="mr-2 h-5 w-5 text-yellow-500" />
            Featured Perks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredPerks.map((perk) => (
              <Card
                key={perk.id}
                className="border-2 border-primary/20 hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getIcon(perk.icon)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{perk.title}</CardTitle>
                        <CardDescription>{perk.provider}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
                      {perk.value}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{perk.description}</p>

                  <div className="flex items-center justify-between">
                    <Badge className={getCategoryColor(perk.category)}>
                      {perk.category}
                    </Badge>
                    <Button size="sm" asChild>
                      <a
                        href={perk.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Claim Perk
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Perks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Available Perks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {perks.map((perk) => (
            <Card key={perk.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {getIcon(perk.icon)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{perk.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {perk.provider}
                      </CardDescription>
                    </div>
                  </div>
                  {perk.featured && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {perk.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={getCategoryColor(perk.category)}
                      variant="secondary"
                    >
                      {perk.category}
                    </Badge>
                    <span className="text-sm font-medium text-primary">
                      {perk.value}
                    </span>
                  </div>
                </div>

                <Button size="sm" variant="outline" className="w-full" asChild>
                  <a
                    href={perk.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn More
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {perks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No perks available at the moment.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back later for exclusive startup deals and credits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
