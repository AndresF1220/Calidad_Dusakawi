
'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const folderStructure = [
  {
    name: 'Documentación',
    children: [
      { name: 'Circular', children: [] },
      { name: 'Formato', children: [] },
      { name: 'Guía', children: [] },
      { name: 'Instructivo', children: [] },
      { name: 'Manual', children: [] },
      { name: 'Política', children: [] },
      { name: 'Programa', children: [] },
      { name: 'Planes', children: [] },
      { name: 'Plantilla', children: [] },
      { name: 'Procedimiento', children: [] },
      { name: 'Protocolo', children: [] },
    ],
  },
];

const sampleFiles = [
    { name: 'Reporte_Q1.pdf', modified: '2024-05-10', size: '2.3 MB' },
    { name: 'Protocolo_Seguridad.docx', modified: '2024-05-09', size: '1.1 MB' },
    { name: 'Guia_de_Usuario.pdf', modified: '2024-05-08', size: '5.8 MB' },
];

const FolderTree = ({ folders, level = 0 }: { folders: any[], level?: number }) => {
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({'Documentación': true});

    const toggleFolder = (name: string) => {
        setOpenFolders(prev => ({...prev, [name]: !prev[name]}));
    }

    return (
        <div>
            {folders.map(folder => (
                <div key={folder.name} style={{ marginLeft: `${level * 16}px`}}>
                    <div className="flex items-center gap-2 cursor-pointer py-1" onClick={() => toggleFolder(folder.name)}>
                        {folder.children.length > 0 && (
                            openFolders[folder.name] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                        )}
                        <FolderIcon className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-medium">{folder.name}</span>
                    </div>
                    {openFolders[folder.name] && folder.children.length > 0 && (
                        <FolderTree folders={folder.children} level={level + 1} />
                    )}
                </div>
            ))}
        </div>
    )
}

export default function RepositoryPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Repositorio de Documentos</h1>
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
            <FolderTree folders={folderStructure} />
          </CardContent>
        </Card>

        {/* File Display */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline text-lg">Archivos</CardTitle>
                <CardDescription>Archivos en la carpeta seleccionada.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Input type="file" className="hidden" id="upload-file-input" />
                <Button asChild variant="outline">
                    <label htmlFor="upload-file-input" className="cursor-pointer">
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
                {sampleFiles.map(file => (
                  <TableRow key={file.name}>
                    <TableCell className="font-medium flex items-center gap-2">
                        <FileIcon className="h-5 w-5 text-gray-400" />
                        {file.name}
                    </TableCell>
                    <TableCell>{file.modified}</TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Descargar</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
