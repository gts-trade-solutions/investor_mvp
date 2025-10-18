'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw, FileText } from 'lucide-react'
import { debounce } from '@/lib/utils'

export default function DeckViewer({ params }) {
  const [deckData, setDeckData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pageStartTime, setPageStartTime] = useState(Date.now())
  
  const canvasRef = useRef(null)
  const viewerRef = useRef(null)

  // Debounced function to send view events
  const sendViewEvent = useRef(
    debounce(async (page, timeSpent) => {
      if (!deckData) return
      
      try {
        await fetch('/api/view-events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            deckLinkId: deckData.id,
            page,
            secondsVisible: Math.floor(timeSpent / 1000),
            viewerIp: null, // Will be set by server
            userAgent: navigator.userAgent
          })
        })
      } catch (error) {
        console.error('Failed to send view event:', error)
      }
    }, 5000)
  ).current

  useEffect(() => {
    loadDeck()
  }, [params.token])

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage)
      
      // Track page view time
      const startTime = Date.now()
      setPageStartTime(startTime)
      
      return () => {
        const timeSpent = Date.now() - startTime
        sendViewEvent(currentPage, timeSpent)
      }
    }
  }, [currentPage, pdfDoc, scale, rotation])

  const loadDeck = async () => {
    try {
      setLoading(true)
      
      // Validate token and get deck info
      const response = await fetch(`/api/deck-links/${params.token}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Deck not found or link has expired')
        } else if (response.status === 403) {
          setError('Access denied. This link may have expired or reached its view limit.')
        } else {
          setError('Failed to load deck')
        }
        return
      }
      
      const deckInfo = await response.json()
      setDeckData(deckInfo)
      
      // Load PDF.js
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument(deckInfo.fileUrl)
      const pdf = await loadingTask.promise
      
      setPdfDoc(pdf)
      setTotalPages(pdf.numPages)
      setCurrentPage(1)
      
    } catch (error) {
      console.error('Error loading deck:', error)
      setError('Failed to load PDF document')
    } finally {
      setLoading(false)
    }
  }

  const renderPage = async (pageNum) => {
    if (!pdfDoc || !canvasRef.current) return
    
    try {
      const page = await pdfDoc.getPage(pageNum)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      // Calculate viewport
      let viewport = page.getViewport({ scale, rotation })
      
      // Set canvas dimensions
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
    } catch (error) {
      console.error('Error rendering page:', error)
    }
  }

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      // Send view event for current page before changing
      const timeSpent = Date.now() - pageStartTime
      sendViewEvent(currentPage, timeSpent)
      
      setCurrentPage(pageNum)
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
  const rotate = () => setRotation(prev => (prev + 90) % 360)

  const downloadDeck = async () => {
    if (!deckData?.downloadUrl) return
    
    try {
      const response = await fetch(deckData.downloadUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = deckData.filename || 'pitch-deck.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading pitch deck...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Deck</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{deckData?.startup?.name || 'Pitch Deck'}</h1>
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Zoom Controls */}
              <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3.0}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              {/* Rotate */}
              <Button variant="outline" size="sm" onClick={rotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
              
              {/* Download */}
              {deckData?.allowDownload && (
                <Button variant="outline" size="sm" onClick={downloadDeck}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={(currentPage / totalPages) * 100} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Sidebar with Thumbnails */}
        <div className="w-64 border-r bg-muted/50 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-medium mb-4">Pages</h3>
            <div className="space-y-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-full p-2 text-left rounded-lg transition-colors ${
                    pageNum === currentPage
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-10 bg-background border rounded flex items-center justify-center text-xs">
                      {pageNum}
                    </div>
                    <span className="text-sm">Page {pageNum}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto" ref={viewerRef}>
          <div className="flex items-center justify-center min-h-full p-8">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="border shadow-lg max-w-full h-auto"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              onClick={prevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm">Page</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-center border rounded"
              />
              <span className="text-sm">of {totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              onClick={nextPage}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}