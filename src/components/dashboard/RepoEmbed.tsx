
'use client';

import { useState, useMemo, useEffect, useRef, useActionState, useTransition } from 'react';
import { useFirestore, useCollection, useStorage, useMemoFirebase } from '@/firebase';
import { useIsAdmin } from '@/lib/authMock';
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
import { getOrCreateRootFolder } from '@/lib/repoUtils';
import { migrateDedupRoots } from '@/lib/migrateRepo';
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
  Loader2,
  AlertTriangle,
  FolderPlus,
  MoreVertical,
  Circle,
  Edit,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Progress } from '../ui/progress';
import { CreateFolderForm } from './CreateFolderForm';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteFolderAction, renameFolderAction } from '@/app/actions';
import { RenameFolderForm } from './RenameFolderForm';


interface RepoEmbedProps {
  areaId: string;
  procesoId?: string;
  subprocesoId?: string;
}

type File = {
  id: string;
  name: string;
  modifiedAt: any;
  size: number;
  url: string;
  path: string; // Storage path
};

type Folder = {
  id: string;
  name: string;
  children: Folder[];
  parentId: string | null;
  createdAt: any; // Keep timestamp for sorting
};

const FolderTree = ({
  folders,
  level = 0,
  onSelectFolder,
  selectedFolder,
  openFolders,
  onToggleFolder,
  onAction,
}: {
  folders: Folder[];
  level?: number;
  onSelectFolder: (folder: Folder) => void;
  selectedFolder: Folder | null;
  openFolders: Record<string, boolean>;
  onToggleFolder: (id: string) => void;
  onAction: (action: 'rename' | 'delete', folder: Folder) => void;
}) => {
  const isAdmin = useIsAdmin();
  if (!folders || folders.length === 0) return null;

  return (
    <div style={{ marginLeft: level > 0 ? '1rem' : '0' }}>
      {folders.map(folder => (
        <div key={folder.id} className="group/folder-item">
          <div
            className={`flex items-center gap-2 cursor-pointer py-1 rounded-md px-2 ${
              selectedFolder?.id === folder.id ? 'bg-muted' : 'hover:bg-muted/50'
            }`}
            onClick={() => onSelectFolder(folder)}
          >
            {folder.children.length > 0 ? (
              <span
                onClick={e => {
                  e.stopPropagation();
                  onToggleFolder(folder.id);
                }}
                className="p-0.5 rounded-sm hover:bg-muted"
              >
                {openFolders[folder.id] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            ) : <div className="w-5"></div>}
            
            <div className="relative">
                 <FolderIcon className="h-5 w-5 text-amber-500" />
                 {selectedFolder?.id === folder.id && (
                    <Circle className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 fill-blue-500 text-blue-500" />
                 )}
            </div>

            <span className="text-sm font-medium select-none flex-1 truncate">
              {folder.name}
            </span>
             {isAdmin && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/folder-item:opacity-100 focus:opacity-100" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onAction('rename', folder); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Renombrar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onAction('delete', folder); }} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
          </div>
          {openFolders[folder.id] && folder.children.length > 0 && (
            <FolderTree
              folders={folder.children}
              level={level + 1}
              onSelectFolder={onSelectFolder}
              selectedFolder={selectedFolder}
              openFolders={openFolders}
              onToggleFolder={onToggleFolder}
              onAction={onAction}
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
  const isAdmin = useIsAdmin();
  const seededRef = useRef(false);
  const { toast } = useToast();
  
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [key, setKey] = useState(0); // Used to force re-render

  const [deleteState, deleteAction] = useActionState(deleteFolderAction, { message: '', error: undefined });
  const [isDeletePending, startDeleteTransition] = useTransition();

  const norm = (v:string|null|undefined) => v === "" || v === undefined ? null : v;

  const foldersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'folders'),
      where('areaId', '==', norm(areaId)),
      where('procesoId', '==', norm(procesoId)),
      where('subprocesoId', '==', norm(subprocesoId))
    );
  }, [firestore, areaId, procesoId, subprocesoId, key]);

  const { data: allFolders, isLoading: isLoadingFolders } = useCollection(foldersQuery);

  const filesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedFolder) return null;
    return query(
        collection(firestore, 'files'),
        where('folderId', '==', selectedFolder.id)
    );
  }, [firestore, selectedFolder, key]);

  const { data: filesData, isLoading: isLoadingFiles } = useCollection(filesQuery);
  const files = filesData as File[] | null;


  useEffect(() => {
    const initRepo = async () => {
      if (firestore) {
        const root = await getOrCreateRootFolder(firestore, { areaId, procesoId, subprocesoId });
        setRootFolderId(root.id);
        if (root.id) {
          setOpenFolders(prev => ({ ...prev, [root.id]: true }));
        }
      }
    };
    if (seededRef.current) return;
    seededRef.current = true;
    initRepo();
  }, [firestore, areaId, procesoId, subprocesoId, key]);


  const folderStructure = useMemo(() => {
    if (!allFolders) return [];

    const folderMap = new Map<string, Folder>();
    const rootLevelFolders: Folder[] = [];
    
    // First pass: create a map of all folders
    allFolders.forEach((doc: any) => {
      if (doc.id !== rootFolderId) {
        folderMap.set(doc.id, { ...doc, children: [] });
      }
    });
    
    // Second pass: build the tree structure
    folderMap.forEach(folder => {
      if (folder.parentId && folder.parentId !== rootFolderId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folder);
        }
      } else if (folder.parentId === rootFolderId) {
        rootLevelFolders.push(folder);
      }
    });
    
    // Sort children alphabetically
    folderMap.forEach(f => f.children.sort((a, b) => a.name.localeCompare(b.name)));
    // Sort root folders alphabetically
    rootLevelFolders.sort((a,b) => a.name.localeCompare(b.name));

    return rootLevelFolders;

  }, [allFolders, rootFolderId]);

  useEffect(() => {
     // Auto-select first folder if nothing is selected and structure is available
     if (!selectedFolder && folderStructure.length > 0) {
        setSelectedFolder(folderStructure[0]);
     } else if (selectedFolder && !allFolders?.find(f => f.id === selectedFolder.id)) {
        // If the selected folder was deleted, select null
        setSelectedFolder(null);
     }
  }, [folderStructure, rootFolderId, selectedFolder, allFolders]);

    useEffect(() => {
        if (deleteState.message && !deleteState.error) {
            toast({
                title: '¡Éxito!',
                description: deleteState.message,
            });
            // If the deleted folder was selected, select its parent or null
            if (folderToEdit && folderToEdit.id === (deleteState as any).deletedFolderId) {
                const parentId = folderToEdit.parentId;
                if (parentId && parentId !== rootFolderId) {
                    const parentFolder = allFolders?.find(f => f.id === parentId) as Folder | null;
                     setSelectedFolder(parentFolder);
                } else {
                     setSelectedFolder(folderStructure.length > 0 ? folderStructure[0] : null);
                }
                setFolderToEdit(null);
            }
        }
        if (deleteState.error) {
            toast({
                variant: 'destructive',
                title: 'Error al Eliminar',
                description: deleteState.error,
            });
        }
        setIsDeletingFolder(false);
    }, [deleteState, toast, folderToEdit, allFolders, rootFolderId, folderStructure]);

  const handleRunMigration = async () => {
    if (!firestore) return;
    setIsMigrating(true);
    try {
        await migrateDedupRoots(firestore);
        setKey(k => k + 1); // Force a re-fetch of all data
    } catch(e) {
        console.error("Migration failed", e);
        alert("La migración falló. Revise la consola para más detalles.");
    } finally {
        setIsMigrating(false);
    }
  }

  const handleFolderAction = (action: 'rename' | 'delete', folder: Folder) => {
    setFolderToEdit(folder);
    if (action === 'rename') {
        setIsRenamingFolder(true);
    } else if (action === 'delete') {
        if (folder.children.length > 0) {
            toast({
                variant: "destructive",
                title: "La carpeta no está vacía",
                description: "No se puede eliminar una carpeta que contiene otras carpetas.",
            });
            return;
        }
         if (folder.id === rootFolderId) {
            toast({
                variant: "destructive",
                title: "Acción no permitida",
                description: "No se puede eliminar la carpeta raíz.",
            });
            return;
        }
        setIsDeletingFolder(true);
    }
  }

  const handleConfirmDelete = () => {
    if (!folderToEdit) return;
    startDeleteTransition(() => {
      const formData = new FormData();
      formData.append('folderId', folderToEdit.id);
      deleteAction(formData);
    });
  };


  const handleToggleFolder = (id: string) => {
    setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0 && selectedFolder && firestore && storage) {
      const file = event.target.files[0];
      const filePath = `repositorio/${norm(areaId)}/${norm(procesoId) || 'global'}/${norm(subprocesoId) || 'global'}/${selectedFolder.id}/${file.name}`;
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
              areaId: norm(areaId),
              procesoId: norm(procesoId),
              subprocesoId: norm(subprocesoId),
              size: file.size,
              type: file.type,
              url: downloadURL,
              path: filePath, 
              createdAt: serverTimestamp(),
              modifiedAt: serverTimestamp(),
              ownerId: 'superuser_id', // TODO: Replace with actual user ID
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

    if (!confirm(`¿Está seguro de que desea eliminar el archivo "${fileToDelete.name}"?`)) {
        return;
    }

    try {
        await deleteDoc(doc(firestore, 'files', fileToDelete.id));

        const fileRef = ref(storage, fileToDelete.path);
        await deleteObject(fileRef);

    } catch (error) {
        console.error("Error deleting file:", error);
        alert("No se pudo eliminar el archivo. Verifique los permisos de Storage.");
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline text-lg">Documentos</CardTitle>
             {isAdmin && (
                <div className="flex items-center gap-1">
                    <CreateFolderForm
                        isOpen={isAddingFolder}
                        onOpenChange={setIsAddingFolder}
                        parentId={rootFolderId} 
                        scope={{ areaId, procesoId, subprocesoId }}
                        disabled={!rootFolderId}
                    >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <FolderPlus className="h-4 w-4" />
                            <span className="sr-only">Crear Carpeta</span>
                        </Button>
                    </CreateFolderForm>
                </div>
            )}
          </CardHeader>
          <CardContent>
            {needsMigration && (
                <div className="mb-4 p-3 rounded-md bg-yellow-100 border border-yellow-300 text-yellow-800">
                    <div className='flex items-center gap-2'>
                        <AlertTriangle className='h-5 w-5'/>
                        <h4 className='font-bold'>Datos Inconsistentes</h4>
                    </div>
                    <p className="text-sm mt-1">Se han detectado carpetas raíz duplicadas. Ejecute la corrección para consolidarlas.</p>
                    <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={handleRunMigration}
                        disabled={isMigrating}
                    >
                        {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Corregir Duplicados
                    </Button>
                </div>
            )}
            {isLoadingFolders || isMigrating ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando carpetas...</span>
                </div>
            ) : folderStructure.length > 0 ? (
              <FolderTree
                folders={folderStructure}
                onSelectFolder={setSelectedFolder}
                selectedFolder={selectedFolder}
                openFolders={openFolders}
                onToggleFolder={handleToggleFolder}
                onAction={handleFolderAction}
              />
            ) : (
              <div className="text-center text-sm text-muted-foreground p-4">
                  No hay carpetas. Cree una para comenzar.
              </div>
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
             {isAdmin && (
                <div className="flex gap-2">
                    <Input
                        type="file"
                        className="hidden"
                        id="upload-file-input"
                        onChange={handleFileUpload}
                        disabled={!selectedFolder}
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
             )}
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
                {isLoadingFiles ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Cargando archivos...</span>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : files && files.length > 0 ? (
                  files.map((file: File) => (
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
                          title="Descargar"
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Descargar</span>
                        </Button>
                        {isAdmin && (
                            <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFileDelete(file)}
                            title="Eliminar"
                            >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Eliminar</span>
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                       {selectedFolder ? "No hay archivos en esta carpeta. Use el botón 'Subir Archivo' para agregar uno." : "Seleccione una carpeta para ver sus archivos."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {folderToEdit && (
        <RenameFolderForm
            isOpen={isRenamingFolder}
            onOpenChange={setIsRenamingFolder}
            folderId={folderToEdit.id}
            initialName={folderToEdit.name}
        >
            <div />
        </RenameFolderForm>
      )}


       <AlertDialog open={isDeletingFolder} onOpenChange={setIsDeletingFolder}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta carpeta?</AlertDialogTitle>
            <AlertDialogDescription>
              Va a eliminar la carpeta "
              <span className="font-semibold">{folderToEdit?.name}</span>". 
              Todos los archivos dentro de esta carpeta serán eliminados permanentemente. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeletePending}
            >
             {isDeletePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
