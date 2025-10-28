
'use client';

import { useState, useMemo } from 'react';
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

type File = { 
    name: string; 
    modified: string; 
    size: string;
    url: string; 
    rawFile: globalThis.File;
};

type Folder = {
    name: string;
    children: Folder[];
    files: File[];
};

const initialFolderStructure: Folder[] = [
  {
    name: 'Documentación',
    files: [],
    children: [
        { name: 'Circular', children: [], files: [] },
        { name: 'Formato', children: [], files: [] },
        { name: 'Guía', children: [], files: [] },
        { name: 'Instructivo', children: [], files: [] },
        { name: 'Manual', children: [], files: [] },
        { name: 'Política', children: [], files: [] },
        { name: 'Programa', children: [], files: [] },
        { name: 'Planes', children: [], files: [] },
        { name: 'Plantilla', children: [], files: [] },
        { name: 'Procedimiento', children: [], files: [] },
        { name: 'Protocolo', children: [], files: []},
    ],
  },
];


const FolderTree = ({ 
    folders, 
    level = 0,
    onSelectFolder,
    selectedFolder,
    openFolders,
    onToggleFolder,
}: { 
    folders: Folder[], 
    level?: number, 
    onSelectFolder: (folder: Folder) => void,
    selectedFolder: Folder | null,
    openFolders: Record<string, boolean>,
    onToggleFolder: (name: string) => void,
}) => {
    
    return (
        <div>
            {folders.map(folder => (
                <div key={folder.name} style={{ marginLeft: `${level * 16}px`}}>
                    <div 
                        className={`flex items-center gap-2 cursor-pointer py-1 rounded-md px-2 ${selectedFolder?.name === folder.name ? 'bg-muted' : ''}`} 
                        onClick={() => onSelectFolder(folder)}
                    >
                        {folder.children.length > 0 && (
                             <span onClick={(e) => { e.stopPropagation(); onToggleFolder(folder.name); }}>
                                {openFolders[folder.name] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </span>
                        )}
                        <FolderIcon className={`h-5 w-5 text-amber-500 ${folder.children.length === 0 ? 'ml-5' : ''}`} />
                        <span className="text-sm font-medium">
                            {folder.name} {folder.files.length > 0 && `(${folder.files.length})`}
                        </span>
                    </div>
                    {openFolders[folder.name] && folder.children.length > 0 && (
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
    )
}

export default function RepositoryDocumentsPage() {
  const [folderStructure, setFolderStructure] = useState<Folder[]>(initialFolderStructure);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(folderStructure[0]);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({'Documentación': true});

  const handleToggleFolder = (name: string) => {
    setOpenFolders(prev => ({...prev, [name]: !prev[name]}));
  }

  // Recursive function to update a folder in the tree
    const updateFolderInTree = (folders: Folder[], targetFolder: Folder, newFiles: File[]): Folder[] => {
        return folders.map(folder => {
            if (folder.name === targetFolder.name) {
                // Also update the target folder itself if it's the one we're looking for
                if (selectedFolder && selectedFolder.name === folder.name) {
                    setSelectedFolder({ ...folder, files: newFiles });
                }
                return { ...folder, files: newFiles };
            }
            if (folder.children.length > 0) {
                return { ...folder, children: updateFolderInTree(folder.children, targetFolder, newFiles) };
            }
            return folder;
        });
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0 && selectedFolder) {
            const file = event.target.files[0];
            const newFile: File = {
                name: file.name,
                modified: new Date().toISOString().split('T')[0],
                size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                url: URL.createObjectURL(file),
                rawFile: file,
            };

            const updatedFiles = [...selectedFolder.files, newFile];
            const newFolderStructure = updateFolderInTree(folderStructure, selectedFolder, updatedFiles);
            
            setFolderStructure(newFolderStructure);

            // Reset file input
            event.target.value = '';
        }
    };
    
    const handleFileDelete = (fileToDelete: File) => {
        if (!selectedFolder) return;

        const updatedFiles = selectedFolder.files.filter(file => file.name !== fileToDelete.name);
        const newFolderStructure = updateFolderInTree(folderStructure, selectedFolder, updatedFiles);

        setFolderStructure(newFolderStructure);
    };

    const handleFileDownload = (file: File) => {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  const filesToShow = useMemo(() => {
    if (!selectedFolder) {
        return [];
    }
    // This is a bit tricky since state updates aren't instant.
    // We need to find the *current* version of the selected folder in the *current* folderStructure
     const findFolder = (folders: Folder[], folderName: string): Folder | undefined => {
        for (const folder of folders) {
            if (folder.name === folderName) return folder;
            if (folder.children) {
                const found = findFolder(folder.children, folderName);
                if (found) return found;
            }
        }
    };
    const currentFolderState = findFolder(folderStructure, selectedFolder.name);
    return currentFolderState ? currentFolderState.files : [];

  }, [selectedFolder, folderStructure]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Explorador de Documentos</h1>
        <p className="text-muted-foreground">
          Navegue, suba y descargue archivos de gestión documental.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Folder Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Carpetas</CardTitle>
          </CardHeader>
          <CardContent>
            <FolderTree 
                folders={folderStructure} 
                onSelectFolder={setSelectedFolder} 
                selectedFolder={selectedFolder}
                openFolders={openFolders}
                onToggleFolder={handleToggleFolder}
            />
          </CardContent>
        </Card>

        {/* File Display */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline text-lg">{selectedFolder ? `Archivos en ${selectedFolder.name}` : 'Archivos'}</CardTitle>
                <CardDescription>Archivos en la carpeta seleccionada.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Input type="file" className="hidden" id="upload-file-input" onChange={handleFileUpload} />
                <Button asChild variant="outline" disabled={!selectedFolder}>
                    <label htmlFor="upload-file-input" className={`cursor-pointer ${!selectedFolder ? 'cursor-not-allowed opacity-50' : ''}`}>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir Archivo
                    </label>
                </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                {filesToShow.map(file => (
                  <TableRow key={file.name}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <FileIcon className="h-5 w-5 text-gray-400" />
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:underline cursor-pointer">
                            {file.name}
                        </a>
                    </TableCell>
                    <TableCell>{file.modified}</TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleFileDownload(file)}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Descargar</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleFileDelete(file)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Eliminar</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {filesToShow.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No hay archivos en esta carpeta.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

