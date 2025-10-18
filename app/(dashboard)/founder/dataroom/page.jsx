'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Folder, FileText, Image, Lock, Users, MoreHorizontal } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function DataRoom() {
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for UI testing
    setFolders([
      {
        id: '1',
        name: 'Financial Documents',
        fileCount: 8,
        createdAt: new Date('2024-01-15')
      },
      {
        id: '2',
        name: 'Legal Documents',
        fileCount: 12,
        createdAt: new Date('2024-01-10')
      },
      {
        id: '3',
        name: 'Product Documentation',
        fileCount: 6,
        createdAt: new Date('2024-01-05')
      }
    ])

    setFiles([
      {
        id: '1',
        name: 'Cap Table.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '245 KB',
        permissions: 3,
        createdAt: new Date('2024-01-15')
      },
      {
        id: '2',
        name: 'Term Sheet.pdf',
        type: 'application/pdf',
        size: '1.2 MB',
        permissions: 5,
        createdAt: new Date('2024-01-12')
      },
      {
        id: '3',
        name: 'Product Demo.mp4',
        type: 'video/mp4',
        size: '15.3 MB',
        permissions: 2,
        createdAt: new Date('2024-01-08')
      }
    ])
    setLoading(false)
  }, [])

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
    if (type.includes('image')) return <Image className="h-5 w-5 text-blue-500" />
    if (type.includes('video')) return <FileText className="h-5 w-5 text-purple-500" />
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Data Room</h1>
          <p className="text-muted-foreground">Loading data room...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Room</h1>
          <p className="text-muted-foreground">
            Securely share sensitive documents with investors
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Folder className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Folder className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-medium">{folder.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {folder.fileCount} files
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Files</h2>
        <div className="space-y-2">
          {files.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No files uploaded yet.</p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First File
                </Button>
              </CardContent>
            </Card>
          ) : (
            files.map((file) => (
              <Card key={file.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div>
                        <h3 className="font-medium">{file.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {file.size} • {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{file.permissions}</span>
                      </div>
                      <Badge variant="outline" size="sm">
                        <Lock className="mr-1 h-3 w-3" />
                        Secure
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}