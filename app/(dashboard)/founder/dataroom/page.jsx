// app/(dashboard)/data-room/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import supabase from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Folder,
  FileText,
  Image,
  Lock,
  Users,
  MoreHorizontal,
  Trash2,
  Eye,
  Download,
  Edit3,
  Upload,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function DataRoom() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null); // upload target

  const fileInputRef = useRef(null);

  // -------------------
  // Initial load
  // -------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // 1) Get logged-in user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) {
          window.location.href = '/auth/signin';
          return;
        }

        setCurrentUserId(user.id);

        // 2) Load folders
        const { data: folderRows, error: folderError } = await supabase
          .from('data_room_folders')
          .select('id, name, created_at')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true });

        if (folderError) throw folderError;

        // 3) Load files
        const { data: fileRows, error: fileError } = await supabase
          .from('data_room_files')
          .select(
            'id, name, mime_type, size_bytes, shared_with_count, created_at, folder_id, storage_path'
          )
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (fileError) throw fileError;

        if (!cancelled) {
          setFolders(
            (folderRows || []).map((f) => ({
              id: f.id,
              name: f.name,
              createdAt: f.created_at ? new Date(f.created_at) : new Date(),
              fileCount: (fileRows || []).filter(
                (file) => file.folder_id === f.id
              ).length,
            }))
          );

          setFiles(
            (fileRows || []).map((file) => ({
              id: file.id,
              name: file.name,
              type: file.mime_type || 'application/octet-stream',
              sizeBytes: file.size_bytes || 0,
              size: formatFileSize(file.size_bytes),
              permissions: file.shared_with_count || 0,
              createdAt: file.created_at
                ? new Date(file.created_at)
                : new Date(),
              folderId: file.folder_id,
              storagePath: file.storage_path,
            }))
          );
        }
      } catch (err) {
        console.error('Error loading data room:', err);
        if (!cancelled) {
          setFolders([]);
          setFiles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------
  // Helpers
  // -------------------
  function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return '—';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  }

  function getFileIcon(type) {
    if (type?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type?.includes('image')) return <Image className="h-5 w-5 text-blue-500" />;
    if (type?.includes('video')) return <FileText className="h-5 w-5 text-purple-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  }

  // Sanitize filename for Supabase storage key
  function makeSafeFileName(originalName) {
    const dotIndex = originalName.lastIndexOf('.');
    const base = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
    const ext = dotIndex !== -1 ? originalName.slice(dotIndex + 1) : '';

    const safeBase = base.replace(/[^a-zA-Z0-9-_]+/g, '_');

    if (!ext) return safeBase;
    return `${safeBase}.${ext}`;
  }

  function triggerFileSelect() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  // -------------------
  // Folder actions
  // -------------------
  async function handleNewFolder() {
    if (!currentUserId) return;
    const name = window.prompt('Folder name?');
    if (!name || !name.trim()) return;

    try {
      setCreatingFolder(true);

      const { data, error } = await supabase
        .from('data_room_folders')
        .insert({
          owner_id: currentUserId,
          name: name.trim(),
        })
        .select('id, name, created_at')
        .single();

      if (error) throw error;

      setFolders((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          createdAt: data.created_at ? new Date(data.created_at) : new Date(),
          fileCount: 0,
        },
      ]);

      // set as upload target
      setSelectedFolderId(data.id);
    } catch (err) {
      console.error('Create folder error:', err);
      alert(err?.message || 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  }

  function handleFolderClick(folder) {
    // just mark as upload target, DON'T filter files => no accordion behaviour
    setSelectedFolderId(folder.id);
  }

  async function handleRenameFolder(folder) {
    const newName = window.prompt('New folder name?', folder.name);
    if (!newName || !newName.trim() || newName === folder.name) return;

    try {
      const { error } = await supabase
        .from('data_room_folders')
        .update({ name: newName.trim() })
        .eq('id', folder.id);

      if (error) throw error;

      setFolders((prev) =>
        prev.map((f) => (f.id === folder.id ? { ...f, name: newName.trim() } : f))
      );
    } catch (err) {
      console.error('Rename folder error:', err);
      alert(err?.message || 'Failed to rename folder.');
    }
  }

  async function handleDeleteFolder(folder) {
    const hasFiles = files.some((f) => f.folderId === folder.id);
    if (hasFiles) {
      alert('Folder is not empty. Move or delete its files before deleting the folder.');
      return;
    }

    const ok = window.confirm(`Delete folder "${folder.name}"?`);
    if (!ok) return;

    try {
      const { error } = await supabase
        .from('data_room_folders')
        .delete()
        .eq('id', folder.id);

      if (error) throw error;

      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      if (selectedFolderId === folder.id) setSelectedFolderId(null);
    } catch (err) {
      console.error('Delete folder error:', err);
      alert(err?.message || 'Failed to delete folder.');
    }
  }

  function handleUploadIntoFolder(folder) {
    setSelectedFolderId(folder.id);
    triggerFileSelect(); // when file is chosen, handleFileChange will use selectedFolderId
  }

  // -------------------
  // Upload file
  // -------------------
  async function handleFileChange(e) {
    const fileList = e.target.files;
    if (!fileList || !fileList.length || !currentUserId) return;

    const file = fileList[0];

    try {
      setUploading(true);

      const safeName = makeSafeFileName(file.name);
      const folderPart = selectedFolderId || 'root';
      const path = `${currentUserId}/${folderPart}/${Date.now()}_${safeName}`;

      // 1) Upload to storage (bucket: data-room)
      const { error: uploadError } = await supabase.storage
        .from('data-room')
        .upload(path, file);

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // 2) Insert row in DB
      const { data: inserted, error: insertError } = await supabase
        .from('data_room_files')
        .insert({
          owner_id: currentUserId,
          folder_id: selectedFolderId, // can be null for root
          name: file.name,
          storage_path: path,
          size_bytes: file.size,
          mime_type: file.type,
          shared_with_count: 0,
        })
        .select(
          'id, name, mime_type, size_bytes, shared_with_count, created_at, folder_id, storage_path'
        )
        .single();

      if (insertError) {
        console.error('Supabase DB insert error:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      // 3) Update local state
      setFiles((prev) => [
        {
          id: inserted.id,
          name: inserted.name,
          type: inserted.mime_type,
          sizeBytes: inserted.size_bytes,
          size: formatFileSize(inserted.size_bytes),
          permissions: inserted.shared_with_count || 0,
          createdAt: inserted.created_at
            ? new Date(inserted.created_at)
            : new Date(),
          folderId: inserted.folder_id,
          storagePath: inserted.storage_path,
        },
        ...prev,
      ]);

      // bump folder fileCount
      if (inserted.folder_id) {
        setFolders((prev) =>
          prev.map((f) =>
            f.id === inserted.folder_id
              ? { ...f, fileCount: (f.fileCount || 0) + 1 }
              : f
          )
        );
      }
    } catch (err) {
      console.error('Upload file error:', err);
      alert(err?.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // -------------------
  // File actions (3 dots menu)
  // -------------------
  async function handleView(file) {
    try {
      if (!file.storagePath) {
        alert('No storage path for this file.');
        return;
      }

      const { data, error } = await supabase.storage
        .from('data-room')
        .createSignedUrl(file.storagePath, 60);

      if (error || !data?.signedUrl) {
        console.error('View signed URL error:', error);
        throw new Error('Failed to create view URL');
      }

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('View file error:', err);
      alert(err?.message || 'Failed to open file.');
    }
  }

  async function handleDownload(file) {
    try {
      if (!file.storagePath) {
        alert('No storage path for this file.');
        return;
      }

      const { data, error } = await supabase.storage
        .from('data-room')
        .createSignedUrl(file.storagePath, 60);

      if (error || !data?.signedUrl) {
        console.error('Download signed URL error:', error);
        throw new Error('Failed to create download URL');
      }

      window.open(data.signedUrl, '_self');
    } catch (err) {
      console.error('Download file error:', err);
      alert(err?.message || 'Failed to download file.');
    }
  }

  async function handleDelete(file) {
    const confirmDelete = window.confirm(
      `Delete "${file.name}" from your data room?`
    );
    if (!confirmDelete) return;

    try {
      // 1) Delete from storage
      if (file.storagePath) {
        const { error: storageError } = await supabase.storage
          .from('data-room')
          .remove([file.storagePath]);

        if (storageError) {
          console.error('Storage delete error:', storageError);
          throw new Error(`Storage delete failed: ${storageError.message}`);
        }
      }

      // 2) Delete from DB
      const { error: dbError } = await supabase
        .from('data_room_files')
        .delete()
        .eq('id', file.id);

      if (dbError) {
        console.error('DB delete error:', dbError);
        throw new Error(`Database delete failed: ${dbError.message}`);
      }

      // 3) Update local state
      setFiles((prev) => prev.filter((f) => f.id !== file.id));

      if (file.folderId) {
        setFolders((prev) =>
          prev.map((folder) =>
            folder.id === file.folderId
              ? {
                  ...folder,
                  fileCount: Math.max((folder.fileCount || 1) - 1, 0),
                }
              : folder
          )
        );
      }
    } catch (err) {
      console.error('Delete file error:', err);
      alert(err?.message || 'Failed to delete file.');
    }
  }

  // -------------------
  // Render
  // -------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Data Room</h1>
          <p className="text-muted-foreground">Loading data room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Room</h1>
          <p className="text-muted-foreground">
            Securely share sensitive documents with investors
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload target:{' '}
            {selectedFolderId
              ? folders.find((f) => f.id === selectedFolderId)?.name ||
                'Selected folder'
              : 'Root (no folder)'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleNewFolder}
            disabled={creatingFolder}
          >
            <Folder className="mr-2 h-4 w-4" />
            {creatingFolder ? 'Creating…' : 'New Folder'}
          </Button>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button onClick={triggerFileSelect} disabled={uploading}>
              <Plus className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading…' : 'Upload Files'}
            </Button>
          </div>
        </div>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className={`hover:shadow-md transition-shadow ${
                  selectedFolderId === folder.id ? 'border-primary' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => handleFolderClick(folder)}
                    >
                      <Folder className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-medium">{folder.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {folder.fileCount} files
                        </p>
                      </div>
                    </div>

                    {/* Folder menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleUploadIntoFolder(folder)}
                        >
                          <Upload className="mr-2 h-3 w-3" />
                          Upload into this folder
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRenameFolder(folder)}
                        >
                          <Edit3 className="mr-2 h-3 w-3" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteFolder(folder)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                <Button className="mt-4" onClick={triggerFileSelect}>
                  <Plus className="mr-2 h-4 w-4" />
                  {uploading ? 'Uploading…' : 'Upload Your First File'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            files.map((file) => (
              <Card
                key={file.id}
                className="hover:shadow-sm transition-shadow"
              >
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
                      <Badge variant="outline" className="text-xs">
                        <Lock className="mr-1 h-3 w-3" />
                        Secure
                      </Badge>

                      {/* File menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(file)}>
                            <Eye className="mr-2 h-3 w-3" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="mr-2 h-3 w-3" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(file)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
