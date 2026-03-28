// app/founder/dashboard/page.jsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { Building2, Users, Target, TrendingUp, FileText, MessageSquare } from 'lucide-react'

export default function FounderDashboard() {
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState(null)

  const [dashboardData, setDashboardData] = useState({
    startups: 0,
    opportunities: 0,
    submissions: 0,
    totalViews: 0,
  })

  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        // 0) auth
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw authError
        if (!user) {
          window.location.href = '/auth/signin'
          return
        }

        if (cancelled) return
        setMe(user)

        const userId = user.id

        // 1) Active Startups = founders rows owned by this user
        // founders.user_id is uuid (from your screenshot)
        const startupsPromise = supabase
          .from('founders')
          .select('user_id', { count: 'exact', head: true })
          .eq('user_id', userId)

        // 2) Active Opportunities = investor_pipeline rows NOT closed
        // startup_id is the founder user id in your pipeline code
        const oppPromise = supabase
          .from('investor_pipeline')
          .select('id', { count: 'exact', head: true })
          .eq('startup_id', userId)
          .neq('stage', 'closed')

        // 3) Pitch Submissions = decks shared/sent
        // simplest: count pitch decks uploaded by this founder
        // (If you have pitch_deck_shares / notifications, we can add them later)
        const submissionsPromise = supabase
          .from('pitch_decks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)

        // 4) Total Deck Views = sum(views) across pitch decks
        // (Supabase doesn't support SUM directly in JS query; we fetch views and sum client-side)
        const viewsPromise = supabase
          .from('pitch_decks')
          .select('views')
          .eq('user_id', userId)

        // 5) Recent Activity: merge recent pitch_decks + recent pipeline events
        const recentDecksPromise = supabase
          .from('pitch_decks')
          .select('id, name, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)

        const recentPipelinePromise = supabase
          .from('investor_pipeline')
          .select('id, stage, created_at, investor_id')
          .eq('startup_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)

        const [
          startupsRes,
          oppRes,
          submissionsRes,
          viewsRes,
          recentDecksRes,
          recentPipeRes,
        ] = await Promise.all([
          startupsPromise,
          oppPromise,
          submissionsPromise,
          viewsPromise,
          recentDecksPromise,
          recentPipelinePromise,
        ])

        // Handle errors individually so one failure doesn't break everything
        if (startupsRes.error) console.error('founders count error:', startupsRes.error)
        if (oppRes.error) console.error('pipeline count error:', oppRes.error)
        if (submissionsRes.error) console.error('pitch_decks count error:', submissionsRes.error)
        if (viewsRes.error) console.error('pitch_decks views error:', viewsRes.error)
        if (recentDecksRes.error) console.error('recent decks error:', recentDecksRes.error)
        if (recentPipeRes.error) console.error('recent pipeline error:', recentPipeRes.error)

        const startups = startupsRes.count ?? 0
        const opportunities = oppRes.count ?? 0
        const submissions = submissionsRes.count ?? 0

        const totalViews =
          (viewsRes.data || []).reduce((sum, r) => sum + (Number(r.views) || 0), 0) || 0

        // --- Build Recent Activity list ---
        const deckActs =
          (recentDecksRes.data || []).map((d) => ({
            id: `deck_${d.id}`,
            type: 'deck_upload',
            title: `Uploaded pitch deck: ${d.name || 'Untitled'}`,
            createdAt: d.created_at ? new Date(d.created_at) : new Date(),
            icon: FileText,
          })) || []

        const pipeActsRaw = recentPipeRes.data || []

        // look up investor names from profiles (profiles.id is TEXT in your earlier setup)
        // investor_pipeline.investor_id might be uuid or text -> normalize to string
        const investorIdsText = Array.from(
          new Set(pipeActsRaw.map((r) => String(r.investor_id || '')).filter(Boolean))
        )

        let nameById = {}
        if (investorIdsText.length) {
          const { data: profs, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', investorIdsText)

          if (profErr) {
            console.error('profiles lookup error:', profErr)
          } else {
            for (const p of profs || []) {
              nameById[String(p.id)] = (p.full_name && String(p.full_name).trim()) || null
            }
          }
        }

        const stageLabel = (st) => {
          if (st === 'to_contact') return 'to_contact'
          if (st === 'discussion') return 'discussion'
          if (st === 'closed') return 'closed'
          return st || 'unknown'
        }

        const pipeActs =
          pipeActsRaw.map((p) => {
            const invIdText = String(p.investor_id || '')
            const fallback = invIdText ? invIdText.slice(0, 8) : 'unknown'
            const invName = nameById[invIdText] || `Investor ${fallback}…`

            return {
              id: `pipe_${p.id}`,
              type: 'pipeline_add',
              title: `Added ${invName} to pipeline (${stageLabel(p.stage)})`,
              createdAt: p.created_at ? new Date(p.created_at) : new Date(),
              icon: MessageSquare,
            }
          }) || []

        const merged = [...deckActs, ...pipeActs]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 8)

        if (!cancelled) {
          setDashboardData({
            startups,
            opportunities,
            submissions,
            totalViews,
          })
          setRecentActivities(merged)
        }
      } catch (e) {
        console.error('Dashboard load error:', e)
        if (!cancelled) {
          setDashboardData({ startups: 0, opportunities: 0, submissions: 0, totalViews: 0 })
          setRecentActivities([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const welcomeName = useMemo(() => {
    if (!me) return 'Founder'
    return me.user_metadata?.full_name || me.email || 'Founder'
  }, [me])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {welcomeName}. Here's your startup overview.
        </p>
      </div>

      {/* ===== Metrics Cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Startups</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.startups}</div>
            <p className="text-xs text-muted-foreground">Your startup profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.opportunities}</div>
            <p className="text-xs text-muted-foreground">Pipeline deals not closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pitch Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.submissions}</div>
            <p className="text-xs text-muted-foreground">Pitch decks uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deck Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.totalViews)}</div>
            <p className="text-xs text-muted-foreground">Across your pitch decks</p>
          </CardContent>
        </Card>
      </div>

      {/* ===== Recent Activity ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your fundraising activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent activity yet.</div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((a) => {
                const Icon = a.icon || FileText
                return (
                  <div key={a.id} className="flex items-start space-x-4">
                    <div className="mt-1">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>

                    <div className="flex-1">
                      <p className="text-sm flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span>{a.title}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.createdAt.toLocaleDateString()} •{' '}
                        {a.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
