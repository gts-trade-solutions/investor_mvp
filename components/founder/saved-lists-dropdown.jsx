'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookmarkPlus, Heart, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function SavedListsDropdown() {
  const [open, setOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const { toast } = useToast()

  // Mock saved lists - replace with actual data
  const savedLists = [
    { id: '1', name: 'Seed Stage VCs', count: 12 },
    { id: '2', name: 'Fintech Investors', count: 8 },
    { id: '3', name: 'Series A Prospects', count: 15 }
  ]

  const handleCreateList = () => {
    if (!newListName.trim()) return
    
    // TODO: API call to create list
    toast({
      title: 'List created',
      description: `"${newListName}" has been created successfully.`
    })
    
    setNewListName('')
    setCreateDialogOpen(false)
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Heart className="mr-2 h-4 w-4" />
            Saved Lists
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>My Investor Lists</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {savedLists.map((list) => (
            <DropdownMenuItem key={list.id}>
              <BookmarkPlus className="mr-2 h-4 w-4" />
              <span>{list.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {list.count}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New List
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Create a new list to organize your favorite investors.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="listName">List Name</Label>
              <Input
                id="listName"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g., Seed Stage VCs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateList}>
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}