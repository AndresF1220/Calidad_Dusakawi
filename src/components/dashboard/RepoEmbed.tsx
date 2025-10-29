
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirestore, useCollection, useStorage } from '@/firebase';
import {
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { ensureRepoRoots } from '@/lib/firestore/ensureRepoRoots';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Download,
  Folder as FolderIcon,
  File as FileIcon,
  ChevronRight,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Progress } from '../ui/progress';

interface RepoEmbedProps {
  areaId: string;
  procesoId?: string;
  subprocesoId?: string;
}

type File = {
  id: string;
  name: string;
  modifiedAt: string;
  size: number;
  url: string;
  path: string; // Storage path
};

type Folder = {
  id: string;
  name: string;
  children: Folder[];
  files: File[];
  parentId: string | null;
};

const FolderTree = ({
  folders,
  level = 0,
  onSelectFolder,
  selectedFolder,
  openFolders,
  onToggleFolder,
}: {
  folders: Folder[];
  level?: number;
  onSelectFolder: (folder: Folder) => void;
  selectedFolder: Folder | null;
  openFolders: Record<string, boolean>;
  onToggleFolder: (id: string) => void;
}) => {
  return (
    <div>
      {folders.map(folder => (
        <div key={folder.id} style={{ marginLeft: `${level * 16}px` }}>
          <div
            className={`flex items-center gap-2 cursor-pointer py-1 rounded-md px-2 ${
              selectedFolder?.id === folder.id ? 'bg-muted' : ''
            }`}
            onClick={() => onSelectFolder(folder)}
          >
            {folder.children.length > 0 && (
              <span
                onClick={e => {
                  e.stopPropagation();
                  onToggleFolder(folder.id);
                }}
              >
                {openFolders[folder.id] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            )}
            <FolderIcon
              className={`h-5 w-5 text-amber-500 ${
                folder.children.length === 0 ? 'ml-5' : ''
              }`}
            />
            <span className="text-sm font-medium">
              {folder.name} {folder.files.length > 0 && `(${folder.files.length})`}
            </span>
          </div>
          {openFolders[folder.id] && folder.children.length > 0 && (
            <FolderTree
              folders={folder.children}
              level={level + 1}
              onSelectFolder={onSelectFolder}
              selectedFolder={selectedFolder}
              openFolders={openFolders}
              onToggleFolder={onToggleFolder}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default function RepoEmbed({
  areaId,
  procesoId,
  subprocesoId,
}: RepoEmbedProps) {
  const firestore = useFirestore();
  const storage = useStorage();
  
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);

  const foldersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'folders'),
      where('areaId', '==', areaId),
      where('procesoId', '==', procesoId ?? null),
      where('subprocesoId', '==', subprocesoId ?? null)
    );
  }, [firestore, areaId, procesoId, subprocesoId]);

  const { data: allFolders, isLoading: isLoadingFolders } = useCollection(foldersQuery);

  const filesQuery = useMemo(() => {
    if (!firestore || !selectedFolder) return null;
    return query(
        collection(firestore, 'files'),
        where('folderId', '==', selectedFolder.id)
    );
  }, [firestore, selectedFolder]);

  const { data: files, isLoading: isLoadingFiles } = useCollection(filesQuery);

  useEffect(() => {
    const initRepo = async () => {
      if (firestore) {
        const rootId = await ensureRepoRoots({ firestore, areaId, procesoId, subprocesoId });
        setRootFolderId(rootId);
        setOpenFolders(prev => ({ ...prev, [rootId]: true }));
      }
    };
    initRepo();
  }, [firestore, areaId, procesoId, subprocesoId]);


  const folderStructure = useMemo(() => {
    if (!allFolders || !rootFolderId) return [];

    const folderMap = new Map<string, Folder>();
    const rootFolders: Folder[] = [];
    
    // Initialize all folders
    allFolders.forEach((doc: any) => {
      folderMap.set(doc.id, { ...doc, children: [], files: [] });
    });

    // Build the tree
    folderMap.forEach(folder => {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        parent?.children.push(folder);
      } else {
        rootFolders.push(folder);
      }
    });

    if (!selectedFolder && rootFolders.length > 0) {
       const root = rootFolders.find(f => f.id === rootFolderId);
       if (root) setSelectedFolder(root);
    }
    
    return rootFolders;

  }, [allFolders, rootFolderId, selectedFolder]);

  const handleToggleFolder = (id: string) => {
    setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0 && selectedFolder && firestore && storage) {
      const file = event.target.files[0];
      const filePath = `repositorio/${areaId}/${procesoId || 'global'}/${subprocesoId || 'global'}/${selectedFolder.id}/${file.name}`;
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload failed:", error);
          setUploadProgress(null);
        }, 
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            await addDoc(collection(firestore, 'files'), {
              name: file.name,
              folderId: selectedFolder.id,
              areaId: areaId,
              procesoId: procesoId ?? null,
              subprocesoId: subprocesoId ?? null,
              size: file.size,
              type: file.type,
              url: downloadURL,
              path: filePath, // Store the path for deletion
              createdAt: serverTimestamp(),
              modifiedAt: serverTimestamp(),
              ownerId: 'superuser_id', // Replace with actual user ID
            });
            setUploadProgress(null);
          });
        }
      );
      event.target.value = '';
    }
  };

  const handleFileDelete = async (fileToDelete: File) => {
    if (!firestore || !storage) return;

    try {
        // Delete Firestore document
        await deleteDoc(doc(firestore, 'files', fileToDelete.id));

        // Delete file from Storage
        const fileRef = ref(storage, fileToDelete.path);
        await deleteObject(fileRef);

        console.log("File deleted successfully");
    } catch (error) {
        console.error("Error deleting file:", error);
    }
  };

  const handleFileDownload = (file: File) => {
    window.open(file.url, '_blank');
  };

  return (
    <>
      <h2 className="text-2xl font-bold font-headline -mb-4">
        Repositorio de Documentos
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Carpetas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingFolders ? <p>Cargando carpetas...</p> : (
              <FolderTree
                folders={folderStructure}
                onSelectFolder={setSelectedFolder}
                selectedFolder={selectedFolder}
                openFolders={openFolders}
                onToggleFolder={handleToggleFolder}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-lg">
                {selectedFolder
                  ? `Archivos en ${selectedFolder.name}`
                  : 'Seleccione una carpeta'}
              </CardTitle>
              <CardDescription>
                Navegue, suba y descargue archivos de gestión documental.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Input
                type="file"
                className="hidden"
                id="upload-file-input"
                onChange={handleFileUpload}
              />
              <Button asChild variant="outline" disabled={!selectedFolder}>
                <label
                  htmlFor="upload-file-input"
                  className={`cursor-pointer ${
                    !selectedFolder ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Archivo
                </label>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
             {uploadProgress !== null && (
                <div className="mb-4">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-center mt-1">{Math.round(uploadProgress)}%</p>
                </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Última modificación</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingFiles || isLoadingFolders ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Cargando archivos...</TableCell>
                    </TableRow>
                ) : files && files.length > 0 ? (
                  files.map((file: any) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <FileIcon className="h-5 w-5 text-gray-400" />
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline cursor-pointer"
                        >
                          {file.name}
                        </a>

                      </TableCell>
                      <TableCell>{file.modifiedAt ? new Date(file.modifiedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{(file.size / (1024)).toFixed(2)} KB</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFileDownload(file)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Descargar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFileDelete(file)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No hay archivos en esta carpeta.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

    