'use client'

import { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Plus } from 'lucide-react'

export function RequestIntroDialog({ onCreated }) {
  const [open, setOpen] = useState(false)

  const [investors, setInvestors] = useState([])
  const [connectors, setConnectors] = useState([])

  const [selectedInvestorId, setSelectedInvestorId] = useState('')
  const [selectedConnectorId, setSelectedConnectorId] = useState('')
  const [message, setMessage] = useState('')

  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  // Load investors + connectors when dialog opens
  useEffect(() => {
    if (!open) return

    let cancelled = false

    async function loadOptions() {
      setLoadingOptions(true)
      setErrorMsg(null)

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) throw authError
        if (!user) {
          setErrorMsg('You must be signed in to request an introduction.')
          return
        }

        // INVESTORS
        const { data: investorRows, error: investorError } = await supabase
          .from('investors')
          .select(`
            user_id,
            investor_type,
            check_min_usd,
            check_max_usd,
            sectors
          `)

        if (investorError) throw investorError

        // CONNECTORS (founders table)
        const { data: connectorRows, error: connectorError } = await supabase
          .from('founders')
          .select(`
            user_id,
            company_name,
            country
          `)

        if (connectorError) throw connectorError

        if (!cancelled) {
          const mappedInvestors = (investorRows || []).map((row) => ({
            id: row.user_id,
            label: `${row.investor_type || 'Investor'}${
              row.sectors ? ` • ${row.sectors}` : ''
            }${
              row.check_min_usd != null && row.check_max_usd != null
                ? ` • ${row.check_min_usd}-${row.check_max_usd} USD`
                : ''
            }`,
          }))

          const mappedConnectors = (connectorRows || []).map((row) => ({
            id: row.user_id,
            label: `${row.company_name || 'Founder'}${
              row.country ? ` • ${row.country}` : ''
            }`,
          }))

          setInvestors(mappedInvestors)
          setConnectors(mappedConnectors)
        }
      } catch (err) {
        console.error('Error loading intro dialog options:', err)
        if (!cancelled) {
          setErrorMsg(err.message || 'Failed to load investors/connectors.')
          setInvestors([])
          setConnectors([])
        }
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    }

    loadOptions()

    return () => {
      cancelled = true
    }
  }, [open])

  // Submit: insert into DB and notify parent
  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg(null)

    if (!selectedInvestorId || !selectedConnectorId) {
      setErrorMsg('Please choose both an investor and a connector.')
      return
    }

    const investor = investors.find((i) => i.id === selectedInvestorId)
    const connector = connectors.find((c) => c.id === selectedConnectorId)

    if (!investor || !connector) {
      setErrorMsg('Invalid investor or connector selection.')
      return
    }

    try {
      setSubmitting(true)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) {
        setErrorMsg('You must be signed in to request an introduction.')
        return
      }

      const { data: inserted, error: insertError } = await supabase
        .from('founder_introductions')
        .insert({
          founder_id: user.id,
          investor_id: selectedInvestorId,
          connector_id: selectedConnectorId,
          investor_label: investor.label,
          connector_label: connector.label,
          message,
          status: 'REQUESTED',
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error', insertError)
        setErrorMsg(insertError.message)
        return
      }

      if (onCreated && inserted) {
        onCreated(inserted)
      }

      // Reset + close
      setSelectedInvestorId('')
      setSelectedConnectorId('')
      setMessage('')
      setOpen(false)
    } catch (err) {
      console.error('Error creating introduction:', err)
      setErrorMsg(err.message || 'Failed to create introduction.')
    } finally {
      setSubmitting(false)
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

      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request Warm Introduction</DialogTitle>
            <DialogDescription>
              Request an introduction to an investor through your network.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Investor */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Investor</p>
              <Select
                value={selectedInvestorId}
                onValueChange={setSelectedInvestorId}
                disabled={loadingOptions || submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select investor for introduction" />
                </SelectTrigger>
                <SelectContent>
                  {loadingOptions && (
                    <SelectItem value="__loading" disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading investors...
                    </SelectItem>
                  )}
                  {!loadingOptions && investors.length === 0 && (
                    <SelectItem value="__none" disabled>
                      No investors found
                    </SelectItem>
                  )}
                  {investors.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Connector */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Connector</p>
              <Select
                value={selectedConnectorId}
                onValueChange={setSelectedConnectorId}
                disabled={loadingOptions || submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select who will make the introduction" />
                </SelectTrigger>
                <SelectContent>
                  {loadingOptions && (
                    <SelectItem value="__loading" disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading connectors...
                    </SelectItem>
                  )}
                  {!loadingOptions && connectors.length === 0 && (
                    <SelectItem value="__none" disabled>
                      No connectors found
                    </SelectItem>
                  )}
                  {connectors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Context &amp; Message</p>
              <Textarea
                rows={4}
                placeholder="Provide context about why you'd like this introduction and what you hope to discuss..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500">
                {errorMsg}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loadingOptions || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
