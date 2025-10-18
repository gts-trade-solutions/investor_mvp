'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MultiSelect } from '@/components/ui/multi-select'
import { Send, Upload, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function SendPitchDialog({ triggerButton, preselectedInvestors = [] }) {
  const [open, setOpen] = useState(false)
  const [selectedInvestors, setSelectedInvestors] = useState(preselectedInvestors)
  const [selectedFile, setSelectedFile] = useState(null)
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  // Mock investor options - replace with actual data
  const investorOptions = [
    'John Investor - VentureCapital Partners',
    'Sarah Partner - HealthTech Capital',
    'Mike Angel - Early Stage Fund',
    'Lisa VC - Growth Capital',
    'David Investor - Seed Fund'
  ]

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type and size
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid file type',
          description: 'Please select a PDF file.',
          variant: 'destructive'
        })
        return
      }
      
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 25MB.',
          variant: 'destructive'
        })
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleSendPitch = async () => {
    if (selectedInvestors.length === 0) {
      toast({
        title: 'No investors selected',
        description: 'Please select at least one investor.',
        variant: 'destructive'
      })
      return
    }

    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a pitch deck to send.',
        variant: 'destructive'
      })
      return
    }

    setIsUploading(true)
    
    try {
      // TODO: Implement file upload and pitch submission
      // 1. Upload file to S3 using presigned URL
      // 2. Create submission records
      
      await new Promise(resolve => setTimeout(resolve, 2000)) // Mock delay
      
      toast({
        title: 'Pitch sent successfully',
        description: `Your pitch has been sent to ${selectedInvestors.length} investor(s).`
      })
      
      // Reset form
      setSelectedInvestors([])
      setSelectedFile(null)
      setMessage('')
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Error sending pitch',
        description: 'Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            <Send className="mr-2 h-4 w-4" />
            Send Pitch
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Pitch Deck</DialogTitle>
          <DialogDescription>
            Share your pitch deck with selected investors.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Select Investors</Label>
            <MultiSelect
              options={investorOptions}
              selected={selectedInvestors}
              onChange={setSelectedInvestors}
              placeholder="Choose investors to send your pitch to..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pitchFile">Pitch Deck (PDF)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="pitchFile"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('pitchFile').click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {selectedFile ? selectedFile.name : 'Choose PDF file'}
              </Button>
            </div>
            {selectedFile && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to accompany your pitch deck..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendPitch} disabled={isUploading}>
            {isUploading ? 'Sending...' : 'Send Pitch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}