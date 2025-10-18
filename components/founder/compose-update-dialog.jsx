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
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Send, Save, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ComposeUpdateDialog() {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [sendToAll, setSendToAll] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  // Mock recipient options - replace with actual investor data
  const recipientOptions = [
    'John Investor - VentureCapital Partners',
    'Sarah Partner - HealthTech Capital',
    'Mike Angel - Early Stage Fund',
    'Lisa VC - Growth Capital',
    'David Investor - Seed Fund'
  ]

  const handleSaveDraft = async () => {
    if (!subject.trim()) {
      toast({
        title: 'Subject required',
        description: 'Please enter a subject for your update.',
        variant: 'destructive'
      })
      return
    }

    try {
      // TODO: API call to save draft
      toast({
        title: 'Draft saved',
        description: 'Your update has been saved as a draft.'
      })
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Error saving draft',
        description: 'Please try again later.',
        variant: 'destructive'
      })
    }
  }

  const handleSendNow = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter both subject and message.',
        variant: 'destructive'
      })
      return
    }

    if (!sendToAll && selectedRecipients.length === 0) {
      toast({
        title: 'No recipients selected',
        description: 'Please select recipients or choose "Send to all investors".',
        variant: 'destructive'
      })
      return
    }

    setIsSending(true)
    
    try {
      // TODO: API call to send update
      await new Promise(resolve => setTimeout(resolve, 2000)) // Mock delay
      
      toast({
        title: 'Update sent',
        description: `Your update has been sent to ${sendToAll ? 'all' : selectedRecipients.length} investor(s).`
      })
      
      // Reset form
      setSubject('')
      setBody('')
      setSelectedRecipients([])
      setSendToAll(false)
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Error sending update',
        description: 'Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleScheduleSend = () => {
    // TODO: Implement scheduling functionality
    toast({
      title: 'Coming soon',
      description: 'Scheduling feature will be available soon.'
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Compose Investor Update</DialogTitle>
          <DialogDescription>
            Keep your investors informed about your progress and milestones.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Q4 2024 Investor Update"
            />
          </div>

          <div className="space-y-4">
            <Label>Recipients</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendToAll"
                checked={sendToAll}
                onCheckedChange={setSendToAll}
              />
              <Label htmlFor="sendToAll" className="text-sm font-normal">
                Send to all connected investors
              </Label>
            </div>
            {!sendToAll && (
              <MultiSelect
                options={recipientOptions}
                selected={selectedRecipients}
                onChange={setSelectedRecipients}
                placeholder="Select specific investors..."
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your latest metrics, milestones, challenges, and asks..."
              rows={8}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button variant="outline" onClick={handleScheduleSend}>
              <Clock className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </div>
          <Button onClick={handleSendNow} disabled={isSending}>
            <Send className="mr-2 h-4 w-4" />
            {isSending ? 'Sending...' : 'Send Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}