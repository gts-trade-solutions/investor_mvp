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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Users } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function RequestIntroDialog() {
  const [open, setOpen] = useState(false)
  const [selectedInvestor, setSelectedInvestor] = useState('')
  const [selectedConnector, setSelectedConnector] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Mock data - replace with actual data
  const investors = [
    { id: '1', name: 'John Investor', firm: 'VentureCapital Partners' },
    { id: '2', name: 'Sarah Partner', firm: 'HealthTech Capital' },
    { id: '3', name: 'Mike Angel', firm: 'Early Stage Fund' },
    { id: '4', name: 'Lisa VC', firm: 'Growth Capital' }
  ]

  const connectors = [
    { id: '1', name: 'Alex Mentor', relationship: 'Former colleague' },
    { id: '2', name: 'Maria Advisor', relationship: 'Board advisor' },
    { id: '3', name: 'David Founder', relationship: 'Fellow entrepreneur' },
    { id: '4', name: 'Jennifer Angel', relationship: 'Previous investor' }
  ]

  const handleSubmitRequest = async () => {
    if (!selectedInvestor || !selectedConnector || !message.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // TODO: API call to create introduction request
      await new Promise(resolve => setTimeout(resolve, 2000)) // Mock delay
      
      const investor = investors.find(i => i.id === selectedInvestor)
      const connector = connectors.find(c => c.id === selectedConnector)
      
      toast({
        title: 'Introduction requested',
        description: `Your request for an introduction to ${investor?.name} via ${connector?.name} has been sent.`
      })
      
      // Reset form
      setSelectedInvestor('')
      setSelectedConnector('')
      setMessage('')
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Error sending request',
        description: 'Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Request Introduction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Warm Introduction</DialogTitle>
          <DialogDescription>
            Request an introduction to an investor through your network.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="investor">Investor</Label>
            <Select value={selectedInvestor} onValueChange={setSelectedInvestor}>
              <SelectTrigger>
                <SelectValue placeholder="Select investor for introduction" />
              </SelectTrigger>
              <SelectContent>
                {investors.map((investor) => (
                  <SelectItem key={investor.id} value={investor.id}>
                    {investor.name} - {investor.firm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="connector">Connector</Label>
            <Select value={selectedConnector} onValueChange={setSelectedConnector}>
              <SelectTrigger>
                <SelectValue placeholder="Select who will make the introduction" />
              </SelectTrigger>
              <SelectContent>
                {connectors.map((connector) => (
                  <SelectItem key={connector.id} value={connector.id}>
                    {connector.name} ({connector.relationship})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Context & Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide context about why you'd like this introduction and what you hope to discuss..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitRequest} disabled={isSubmitting}>
            <Users className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}