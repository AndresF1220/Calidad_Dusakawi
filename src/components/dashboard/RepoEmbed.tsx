

'use client';

import { useState, useMemo, useEffect, useRef, useTransition } from 'react';
import { useFirestore, useCollection, useStorage, useMemoFirebase } from '@/firebase';
import { useIsAdmin } from '@/lib/authMock';
import {
  collection,
  query,
  where,
} from 'firebase/firestore';
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
  Folder as FolderIcon,
  FileText,
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
import { Progress } from '../ui/progress';
import { CreateFolderForm } from './CreateFolderForm';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteFolderAction } from '@/app/actions';
import { RenameFolderForm } from './RenameFolderForm';
import { UploadFileForm } from './UploadFileForm';


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
  code: string;
  version: string;
  validityDate: any;
};

type Folder = {
  id: string;
  name: string;
  children: Folder[];
  parentId: string | null;
  createdAt: any; // Keep timestamp for sorting
};

const mockFiles: File[] = [
    { id: '1', code: 'FIN-001', name: 'Presupuesto Anual 2024', version: '2.1', validityDate: { seconds: 1732057200 }, url: '#', path: '', modifiedAt: null, size: 0 },
    { id: '2', code: 'RH-015', name: 'Política de Teletrabajo', version: '1.3', validityDate: { seconds: 1729388400 }, url: '#', path: '', modifiedAt: null, size: 0 },
    { id: '3', code: 'CAL-007', name: 'Manual de Calidad', version: '4.0', validityDate: { seconds: 1714518000 }, url: '', path: '', modifiedAt: null, size: 0 },
];


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
  onAction: (action: 'rename' | 'delete', folder: Folder, event: React.MouseEvent) => void;
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
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onAction('rename', folder, e as any); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Renombrar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onAction('delete', folder, e as any); }} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
  const { toast } = useToast();
  
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const [isDeletePending, startDeleteTransition] = useTransition();

  const norm = (v:string|null|undefined) => v === "" || v === undefined || v === "null" ? null : v;

  const foldersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'folders'),
      where('areaId', '==', norm(areaId)),
      where('procesoId', '==', norm(procesoId)),
      where('subprocesoId', '==', norm(subprocesoId))
    );
  }, [firestore, areaId, procesoId, subprocesoId]);

  const { data: allFolders, isLoading: isLoadingFolders } = useCollection(foldersQuery);

  const filesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedFolder) return null;
    return query(
        collection(firestore, 'files'),
        where('folderId', '==', selectedFolder.id)
    );
  }, [firestore, selectedFolder]);

  // Using mock data for now
  const files = mockFiles;
  const isLoadingFiles = false;


  const folderStructure = useMemo(() => {
    if (!allFolders) return [];
    
    const folderMap = new Map<string, Folder>();
    allFolders.forEach((doc: any) => {
      folderMap.set(doc.id, { ...doc, children: [] });
    });

    const rootFolders: Folder[] = [];
    folderMap.forEach(folder => {
        if (folder.parentId && folderMap.has(folder.parentId)) {
            folderMap.get(folder.parentId)!.children.push(folder);
        } else {
            rootFolders.push(folder);
        }
    });

    const sortRecursive = (folders: Folder[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach(f => {
        if (f.children && f.children.length > 0) {
          sortRecursive(f.children);
        }
      });
    };

    sortRecursive(rootFolders);
    return rootFolders;

  }, [allFolders]);

  useEffect(() => {
     if (selectedFolder && !allFolders?.find(f => f.id === selectedFolder.id)) {
        const parentId = selectedFolder.parentId;
        if (parentId) {
            const parentFolder = allFolders?.find(f => f.id === parentId) as Folder | null;
            setSelectedFolder(parentFolder);
        } else {
            setSelectedFolder(null);
        }
     }
  }, [allFolders, selectedFolder]);


  const handleFolderAction = (action: 'rename' | 'delete', folder: Folder, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
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
        setIsDeletingFolder(true);
    }
  }

  const handleConfirmDelete = () => {
    if (!folderToEdit) return;
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.append('folderId', folderToEdit.id);
      
      const result = await deleteFolderAction(null, formData);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error al Eliminar',
          description: result.error,
        });
      } else {
        toast({
          title: '¡Éxito!',
          description: result.message,
        });
        if (selectedFolder?.id === folderToEdit.id) {
            setSelectedFolder(null);
        }
      }
      setIsDeletingFolder(false);
      setFolderToEdit(null);
    });
  };


  const handleToggleFolder = (id: string) => {
    setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileDelete = async (fileToDelete: File) => {
    if (!firestore || !storage) return;

    if (!confirm(`¿Está seguro de que desea eliminar el archivo "${fileToDelete.name}"?`)) {
        return;
    }

    try {
        toast({
            title: "Archivo Eliminado",
            description: `Se eliminó "${fileToDelete.name}".`
        });

    } catch (error) {
        console.error("Error deleting file:", error);
        toast({
            variant: "destructive",
            title: "Error al Eliminar",
            description: "No se pudo eliminar el archivo. Verifique los permisos de Storage."
        });
    }
  };


  const ViewFileButton = ({ url }: { url: string }) => {
    if (!url || url === '#') {
        return (
            <Button variant="ghost" size="icon" disabled title="Ver Documento">
                <FileText className="h-4 w-4" />
                <span className="sr-only">Ver Documento</span>
            </Button>
        )
    }
    return (
        <Button asChild variant="ghost" size="icon" title="Ver Documento">
            <a href={url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                <span className="sr-only">Ver Documento</span>
            </a>
        </Button>
    )
  }

  return (
    <>
      <h2 className="text-2xl font-bold font-headline -mb-4">
        Documentos
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline text-lg">Carpetas</CardTitle>
             {isAdmin && (
                <div className="flex items-center gap-1">
                    <CreateFolderForm
                        isOpen={isAddingFolder}
                        onOpenChange={setIsAddingFolder}
                        parentId={selectedFolder?.id || null} 
                        scope={{ areaId, procesoId, subprocesoId }}
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
            {isLoadingFolders ? (
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
                  ? selectedFolder.name
                  : 'Seleccione una carpeta'}
              </CardTitle>
              <CardDescription>
                Documentos en esta carpeta.
              </CardDescription>
            </div>
             {isAdmin && (
                 <UploadFileForm 
                    isOpen={isUploading} 
                    onOpenChange={setIsUploading}
                    disabled={!selectedFolder}
                 >
                    <Button variant="outline" disabled={!selectedFolder}>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir Archivo
                    </Button>
                </UploadFileForm>
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
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre del documento</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingFiles ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Cargando documentos...</span>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : files && files.length > 0 ? (
                  files.map((file: File) => (
                    <TableRow key={file.id}>
                        <TableCell className="font-mono text-xs">{file.code}</TableCell>
                        <TableCell className="font-medium">{file.name}</TableCell>
                        <TableCell className="text-center">{file.version}</TableCell>
                        <TableCell>{file.validityDate ? new Date(file.validityDate.seconds * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                             <ViewFileButton url={file.url} />
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
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                       {selectedFolder ? "Esta carpeta está vacía. Use ‘Subir Archivo’ para agregar documentos." : "Seleccione una carpeta para ver sus archivos."}
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
