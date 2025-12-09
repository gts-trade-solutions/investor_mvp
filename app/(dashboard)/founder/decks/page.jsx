'use client'

import { useState, useEffect, useRef } from 'react'
import supabase from '@/lib/supabaseClient'
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
  Plus,
  FileText,
  Eye,
  Download,
  Share,
  MoreHorizontal,
} from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/utils'

export default function PitchDecks() {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)

        // 1) Get logged-in user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw authError
        if (!user) {
          window.location.href = '/auth/signin'
          return
        }

        setCurrentUserId(user.id)

        // 2) Load that user's pitch decks
        const { data, error } = await supabase
          .from('pitch_decks')
          .select(
            'id, user_id, name, file_path, size_bytes, views, downloads, mime_type, created_at'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (!cancelled) {
          setDecks((data || []).map(mapRowToDeck))
        }
      } catch (err) {
        console.error('Error loading pitch decks:', err)
        if (!cancelled) setDecks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  function mapRowToDeck(row) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      filePath: row.file_path,
      sizeBytes: row.size_bytes,
      size: formatFileSize(row.size_bytes),
      views: row.views || 0,
      downloads: row.downloads || 0,
      type: row.mime_type || 'application/pdf',
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    }
  }

  function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return '—'
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb.toFixed(1)} MB`
    const gb = mb / 1024
    return `${gb.toFixed(1)} GB`
  }

  // Sanitize filename for Supabase storage key
  function makeSafeFileName(originalName) {
    const dotIndex = originalName.lastIndexOf('.')
    const base = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName
    const ext = dotIndex !== -1 ? originalName.slice(dotIndex + 1) : ''

    // Keep only letters, numbers, dash, underscore
    const safeBase = base.replace(/[^a-zA-Z0-9-_]+/g, '_')

    if (!ext) return safeBase
    return `${safeBase}.${ext}`
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file || !currentUserId) return

    try {
      setUploading(true)

      const safeName = makeSafeFileName(file.name)
      const ext = safeName.split('.').pop()
      const path = `${currentUserId}/${Date.now()}_${safeName}`

      console.log('Uploading to path:', path)

      // 1) Upload to storage (bucket: pitch-deck)
      const { error: uploadError } = await supabase.storage
        .from('pitch-deck')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      // 2) Insert row in DB
      const { data: inserted, error: insertError } = await supabase
        .from('pitch_decks')
        .insert({
          user_id: currentUserId,
          name: file.name, // display original name
          file_path: path,
          size_bytes: file.size,
          views: 0,
          downloads: 0,
          mime_type: file.type || `application/${ext || 'octet-stream'}`,
        })
        .select(
          'id, user_id, name, file_path, size_bytes, views, downloads, mime_type, created_at'
        )
        .single()

      if (insertError) {
        console.error('Supabase DB insert error:', insertError)
        throw new Error(`Database insert failed: ${insertError.message}`)
      }

      // 3) Update local state
      setDecks((prev) => [mapRowToDeck(inserted), ...prev])
    } catch (err) {
      console.error('Upload deck error (catch):', err)
      alert(err?.message || 'Failed to upload deck. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleView(deck) {
    try {
      if (!deck.filePath) {
        alert('File path missing for this deck.')
        return
      }

      const { data, error } = await supabase.storage
        .from('pitch-deck')
        .createSignedUrl(deck.filePath, 60)

      if (error || !data?.signedUrl) {
        console.error('View signed URL error:', error)
        throw new Error('No signed URL for viewing')
      }

      supabase
        .from('pitch_decks')
        .update({ views: (deck.views || 0) + 1 })
        .eq('id', deck.id)
        .then(() => {
          setDecks((prev) =>
            prev.map((d) =>
              d.id === deck.id ? { ...d, views: d.views + 1 } : d
            )
          )
        })
        .catch((err) => console.error('Update views error:', err))

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('View deck error:', err)
      alert(err?.message || 'Failed to open deck.')
    }
  }

  async function handleDownload(deck) {
    try {
      if (!deck.filePath) {
        alert('File path missing for this deck.')
        return
      }

      const { data, error } = await supabase.storage
        .from('pitch-deck')
        .createSignedUrl(deck.filePath, 60)

      if (error || !data?.signedUrl) {
        console.error('Download signed URL error:', error)
        throw new Error('No signed URL for download')
      }

      supabase
        .from('pitch_decks')
        .update({ downloads: (deck.downloads || 0) + 1 })
        .eq('id', deck.id)
        .then(() => {
          setDecks((prev) =>
            prev.map((d) =>
              d.id === deck.id ? { ...d, downloads: d.downloads + 1 } : d
            )
          )
        })
        .catch((err) => console.error('Update downloads error:', err))

      window.open(data.signedUrl, '_self')
    } catch (err) {
      console.error('Download deck error:', err)
      alert(err?.message || 'Failed to download deck.')
    }
  }

  async function handleShare(deck) {
    try {
      if (!deck.filePath) {
        alert('File path missing for this deck.')
        return
      }

      const sevenDays = 60 * 60 * 24 * 7
      const { data, error } = await supabase.storage
        .from('pitch-deck')
        .createSignedUrl(deck.filePath, sevenDays)

      if (error || !data?.signedUrl) {
        console.error('Share signed URL error:', error)
        throw new Error('No signed URL for sharing')
      }

      const url = data.signedUrl

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        alert('Share link copied to clipboard.')
      } else {
        prompt('Copy this link:', url)
      }
    } catch (err) {
      console.error('Share deck error:', err)
      alert(err?.message || 'Failed to create share link.')
    }
  }

  function triggerFileSelect() {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pitch Decks</h1>
          <p className="text-muted-foreground">Loading pitch decks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pitch Decks</h1>
          <p className="text-muted-foreground">
            Manage your pitch decks and track engagement
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={triggerFileSelect} disabled={uploading}>
            <Plus className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload Deck'}
          </Button>
        </div>
      </div>

      {/* Decks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No pitch decks uploaded yet.
            </p>
            <Button
              className="mt-4"
              onClick={triggerFileSelect}
              disabled={uploading}
            >
              <Plus className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading…' : 'Upload Your First Deck'}
            </Button>
          </div>
        ) : (
          decks.map((deck) => (
            <Card key={deck.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg line-clamp-1">
                          {deck.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase"
                        >
                          {deck.type?.split('/')[1] || 'PDF'}
                        </Badge>
                      </div>
                      <CardDescription>{deck.size}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => handleView(deck)}
                    className="flex items-center space-x-2 text-left hover:underline"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{formatNumber(deck.views)} views</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(deck)}
                    className="flex items-center space-x-2 text-left hover:underline"
                  >
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span>{formatNumber(deck.downloads)} downloads</span>
                  </button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Uploaded {formatDate(deck.createdAt)}
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    type="button"
                    onClick={() => handleView(deck)}
                  >
                    <Eye className="mr-2 h-3 w-3" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    type="button"
                    onClick={() => handleShare(deck)}
                  >
                    <Share className="mr-2 h-3 w-3" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
