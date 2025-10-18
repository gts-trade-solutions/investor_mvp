'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

export default function Settings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [authLoaded, setAuthLoaded] = useState(false)
  const [user, setUser] = useState(null)
  const [founder, setFounder] = useState(null)   // null => loading, {} => editable new row
  const [investor, setInvestor] = useState(null)

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    image: '',
    role: ''
  })

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    pushNotifications: true,
    weeklyDigest: false,
    investmentAlerts: true
  })

  // Fetch user + BOTH founder & investor rows (so both tabs can be used)
  useEffect(() => {
    const getAll = async () => {
      const { data } = await supabase.auth.getUser()
      const currentUser = data?.user || null
      setUser(currentUser)

      if (currentUser) {
        const role = (currentUser.user_metadata?.role || 'USER').toUpperCase()
        setProfile({
          name: currentUser.user_metadata?.name || '',
          email: currentUser.email || '',
          image: currentUser.user_metadata?.avatar_url || '',
          role
        })

        // Fetch both; if missing, set to {} so the form can create via upsert
        const [{ data: f }, { data: i }] = await Promise.all([
          supabase.from('founders').select('*').eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('investors').select('*').eq('user_id', currentUser.id).maybeSingle()
        ])
        setFounder(f ?? {})
        setInvestor(i ?? {})
      }

      setAuthLoaded(true)
    }
    getAll()
  }, [])

  // Profile update (demo)
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
      toast({ title: 'Profile updated', description: 'Your profile has been updated successfully.' })
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Founder: UPSERT by user_id (works for create + update)
  const handleFounderUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const authedUser = auth?.user
      if (!authedUser) return

      const payload = {
        user_id: authedUser.id,
        company_name: founder?.company_name ?? null,
        website: founder?.website ?? null,
        industry: founder?.industry ?? null,
        country: founder?.country ?? null,
        stage: founder?.stage ?? null,
        team_size:
          founder?.team_size !== '' && founder?.team_size != null ? Number(founder.team_size) : null,
        capital_raised_usd:
          founder?.capital_raised_usd !== '' && founder?.capital_raised_usd != null
            ? Number(founder.capital_raised_usd)
            : null,
        tagline: founder?.tagline ?? null,
        problem_solution: founder?.problem_solution ?? null
      }

      const { data: saved, error } = await supabase
        .from('founders')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .maybeSingle()

      if (error) throw error
      if (saved) setFounder(saved)

      toast({ title: 'Founder details saved', description: 'Your company info has been updated.' })
    } catch (error) {
      toast({
        title: 'Error updating founder info',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Investor: UPSERT by user_id (mapped to your actual columns)
  const handleInvestorUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const authedUser = auth?.user
      if (!authedUser) return

      const payload = {
        user_id: authedUser.id,
        investor_type: investor?.investor_type ?? null,
        check_min_usd:
          investor?.check_min_usd !== '' && investor?.check_min_usd != null
            ? Number(investor.check_min_usd)
            : null,
        check_max_usd:
          investor?.check_max_usd !== '' && investor?.check_max_usd != null
            ? Number(investor.check_max_usd)
            : null,
        sectors: investor?.sectors ?? null,
        geos: investor?.geos ?? null
      }

      const { data: saved, error } = await supabase
        .from('investors')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .maybeSingle()

      if (error) throw error
      if (saved) setInvestor(saved)

      toast({ title: 'Investor details saved', description: 'Your investor info has been updated.' })
    } catch (error) {
      toast({
        title: 'Error updating investor info',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Notifications demo
  const handleNotificationUpdate = async (key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
    toast({ title: 'Notification settings updated', description: 'Preferences saved.' })
  }

  // Skeleton while hydrating
  if (!authLoaded) {
    return (
      <div className="space-y-2 p-6">
        <div className="h-7 w-40 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted/70" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold">Please sign in to view Settings</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          {/* Show both tabs so a single user can edit both profiles */}
          <TabsTrigger value="founder">Founder Details</TabsTrigger>
          <TabsTrigger value="investor">Investor Details</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profile.email} disabled className="bg-muted" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={profile.role || 'N/A'} disabled className="bg-muted" />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified about updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'emailUpdates', label: 'Email Updates', desc: 'Receive important emails' },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get browser alerts' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'A summary of your activity' },
                { key: 'investmentAlerts', label: 'Investment Alerts', desc: 'New opportunities' }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={(checked) => handleNotificationUpdate(item.key, checked)}
                    />
                  </div>
                  {i < 3 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Founder Details Tab */}
        <TabsContent value="founder">
          <Card>
            <CardHeader>
              <CardTitle>Founder Details</CardTitle>
              <CardDescription>Edit your company and business info</CardDescription>
            </CardHeader>
            <CardContent>
              {founder === null ? (
                <p className="text-sm text-muted-foreground">Loading founder details...</p>
              ) : (
                <form onSubmit={handleFounderUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={founder.company_name || ''}
                        onChange={(e) => setFounder({ ...founder, company_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={founder.website || ''}
                        onChange={(e) => setFounder({ ...founder, website: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input
                        value={founder.industry || ''}
                        onChange={(e) => setFounder({ ...founder, industry: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>HQ Country</Label>
                      <Input
                        value={founder.country || ''}
                        onChange={(e) => setFounder({ ...founder, country: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Stage</Label>
                      <Input
                        value={founder.stage || ''}
                        onChange={(e) => setFounder({ ...founder, stage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Team Size</Label>
                      <Input
                        type="number"
                        value={founder.team_size || ''}
                        onChange={(e) => setFounder({ ...founder, team_size: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Capital Required (USD)</Label>
                      <Input
                        type="number"
                        value={founder.capital_raised_usd || ''}
                        onChange={(e) => setFounder({ ...founder, capital_raised_usd: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tagline</Label>
                    <Input
                      value={founder.tagline || ''}
                      onChange={(e) => setFounder({ ...founder, tagline: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Problem & Solution</Label>
                    <textarea
                      rows={4}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={founder.problem_solution || ''}
                      onChange={(e) => setFounder({ ...founder, problem_solution: e.target.value })}
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Founder Info'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investor Details Tab */}
        <TabsContent value="investor">
          <Card>
            <CardHeader>
              <CardTitle>Investor Details</CardTitle>
              <CardDescription>Edit your organization and investment info</CardDescription>
            </CardHeader>
            <CardContent>
              {investor === null ? (
                <p className="text-sm text-muted-foreground">Loading investor details...</p>
              ) : (
                <form onSubmit={handleInvestorUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Investor Type</Label>
                      <Input
                        value={investor.investor_type || ''}
                        onChange={(e) => setInvestor({ ...investor, investor_type: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Geographies (geos)</Label>
                      <Input
                        value={investor.geos || ''}
                        onChange={(e) => setInvestor({ ...investor, geos: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Check Min (USD)</Label>
                      <Input
                        type="number"
                        value={investor.check_min_usd ?? ''}
                        onChange={(e) => setInvestor({ ...investor, check_min_usd: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Check Max (USD)</Label>
                      <Input
                        type="number"
                        value={investor.check_max_usd ?? ''}
                        onChange={(e) => setInvestor({ ...investor, check_max_usd: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Sectors</Label>
                    <Input
                      value={investor.sectors || ''}
                      onChange={(e) => setInvestor({ ...investor, sectors: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: comma-separate multiple sectors (e.g., "Fintech, AI, SaaS").
                    </p>
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Investor Info'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
