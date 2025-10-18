'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, MoreHorizontal, UserPlus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Mock data for UI testing
    setUsers([
      {
        id: '1',
        name: 'Jane Founder',
        email: 'jane@startup.com',
        role: 'FOUNDER',
        createdAt: new Date('2024-01-15'),
        lastActive: new Date('2024-01-20')
      },
      {
        id: '2',
        name: 'John Investor',
        email: 'john@vc.com',
        role: 'INVESTOR',
        createdAt: new Date('2024-01-10'),
        lastActive: new Date('2024-01-19')
      },
      {
        id: '3',
        name: 'Admin User',
        email: 'admin@investmatch.com',
        role: 'ADMIN',
        createdAt: new Date('2024-01-01'),
        lastActive: new Date('2024-01-20')
      }
    ])
    setLoading(false)
  }, [])

  const getRoleBadge = (role) => {
    const colors = {
      FOUNDER: 'bg-blue-100 text-blue-800',
      INVESTOR: 'bg-green-100 text-green-800',
      ADMIN: 'bg-purple-100 text-purple-800'
    }
    return (
      <Badge className={colors[role] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage platform users and their roles
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users..."
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {users.length} users registered on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">
                      {user.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(user.createdAt)} • Last active {formatDate(user.lastActive)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getRoleBadge(user.role)}
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}