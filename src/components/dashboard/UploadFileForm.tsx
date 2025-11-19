
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CustomCalendar } from './CustomCalendar';

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

interface UploadFileFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
  folderId: string | null;
  scope: {
    areaId: string | null;
    procesoId?: string | null;
    subprocesoId?: string | null;
  };
}

export function UploadFileForm({
  isOpen,
  onOpenChange,
  children,
  disabled = false,
  folderId,
  scope,
}: UploadFileFormProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { firestore, storage } = useFirebase();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
      setSelectedFileName('');
      setSelectedDate(undefined);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
    } else {
      setSelectedFileName('');
    }
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedFile = (formData.get('file') as File);
    
    if (!selectedFile || !folderId || !scope.areaId || !storage || !firestore) {
      toast({
          variant: 'destructive',
          title: 'Error de validación',
          description: "Faltan datos o la conexión a Firebase no está lista.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const pathParts = ['documentos', scope.areaId, scope.procesoId, scope.subprocesoId, folderId, selectedFile.name].filter(Boolean);
        const fullPath = pathParts.join('/');
        const fileStorageRef = ref(storage, fullPath);

        // 1. Upload file
        const uploadResult = await uploadBytes(fileStorageRef, selectedFile);
        
        // 2. Get download URL
        const url = await getDownloadURL(uploadResult.ref);

        // 3. Save metadata to Firestore
        const docData = {
          code: formData.get('code') as string,
          name: formData.get('name') as string,
          version: formData.get('version') as string,
          validityDate: selectedDate ? new Date(selectedDate) : null,
          folderId: folderId,
          areaId: scope.areaId,
          procesoId: scope.procesoId || null,
          subprocesoId: scope.subprocesoId || null,
          path: fullPath,
          url: url,
          size: selectedFile.size,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(firestore, 'documents'), docData);

        toast({
          title: '¡Éxito!',
          description: 'Documento guardado con éxito.',
        });
        onOpenChange(false);

      } catch (e: any) {
        console.error('Error uploading file:', e);
        toast({
          variant: 'destructive',
          title: 'Error al Guardar',
          description: `No se pudo guardar el documento: ${e.message}`,
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Subir Nuevo Documento</DialogTitle>
          <DialogDescription>
            Complete la información del documento y seleccione el archivo para subir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} ref={formRef} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Código del documento</Label>
            <Input id="code" name="code" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del documento</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="version">Versión</Label>
                <Input id="version" name="version" required/>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="validityDate">Fecha de vigencia</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant={'outline'}
                        className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, 'PPP', { locale: es })
                        ) : (
                          <span>Elija una fecha</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <CustomCalendar
                        mode="single"
                        selected={selectedDate}
                        onDayClick={handleSelectDate}
                        initialFocus
                        locale={es}
                        onSelect={handleSelectDate}
                    />
                    </PopoverContent>
                </Popover>
                 <Input 
                    type="hidden" 
                    name="validityDate" 
                    value={selectedDate ? selectedDate.toISOString() : ''} 
                />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="file-upload-button">Archivo (PDF, Word, Excel, JPG, PNG)</Label>
            <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                <Button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar archivo
                </Button>
                <span className="text-sm text-muted-foreground truncate min-w-0">
                    {selectedFileName || 'No hay archivo seleccionado'}
                </span>
                <Input 
                    id="file-upload-button" 
                    name="file"
                    type="file" 
                    accept={ACCEPTED_FILE_TYPES.join(',')}
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    required
                />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
             <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Subiendo...' : 'Subir y Guardar'}
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
