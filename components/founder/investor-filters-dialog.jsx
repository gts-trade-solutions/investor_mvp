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
import { MultiSelect } from '@/components/ui/multi-select'
import { RangeSlider } from '@/components/ui/range-slider'
import { Filter } from 'lucide-react'
import { SECTORS, STAGES, GEOS, formatCurrency } from '@/lib/utils'

export function InvestorFiltersDialog({ filters, onFiltersChange }) {
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  const handleResetFilters = () => {
    const resetFilters = {
      sectors: [],
      stages: [],
      geos: [],
      checkSizeRange: [0, 10000000] // $0 to $100M in cents
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Investors</DialogTitle>
          <DialogDescription>
            Refine your search to find the most relevant investors for your startup.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="sectors">Sectors</Label>
            <MultiSelect
              options={SECTORS}
              selected={localFilters.sectors}
              onChange={(sectors) => setLocalFilters(prev => ({ ...prev, sectors }))}
              placeholder="Select sectors..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stages">Investment Stages</Label>
            <MultiSelect
              options={STAGES}
              selected={localFilters.stages}
              onChange={(stages) => setLocalFilters(prev => ({ ...prev, stages }))}
              placeholder="Select stages..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="geos">Geographies</Label>
            <MultiSelect
              options={GEOS}
              selected={localFilters.geos}
              onChange={(geos) => setLocalFilters(prev => ({ ...prev, geos }))}
              placeholder="Select geographies..."
            />
          </div>

          <div className="space-y-4">
            <Label>Check Size Range</Label>
            <div className="px-2">
              <RangeSlider
                value={localFilters.checkSizeRange}
                onValueChange={(checkSizeRange) => setLocalFilters(prev => ({ ...prev, checkSizeRange }))}
                max={10000000} // $100M in cents
                min={0}
                step={50000} // $500 steps
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{formatCurrency(localFilters.checkSizeRange[0])}</span>
                <span>{formatCurrency(localFilters.checkSizeRange[1])}</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleResetFilters}>
            Reset
          </Button>
          <Button onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}