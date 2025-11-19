

'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { createDocumentAction } from '@/app/actions';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '@/firebase';


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


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {pending ? 'Guardando...' : 'Subir y Guardar'}
        </Button>
    );
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
  const { storage } = useFirebase();
  const [state, formAction] = useActionState(createDocumentAction, { message: '', error: undefined });
  
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
      setSelectedFile(null);
      setSelectedFileName('');
      setSelectedDate(undefined);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (state.message && !state.error) {
      toast({
        title: '¡Éxito!',
        description: state.message,
      });
      onOpenChange(false);
    }
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Error al Guardar',
        description: state.error,
      });
    }
  }, [state, toast, onOpenChange]);

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
    } else {
      setSelectedFile(null);
      setSelectedFileName('');
    }
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile || !folderId || !scope.areaId || !storage) {
        toast({
            variant: 'destructive',
            title: 'Error de validación',
            description: 'Faltan datos o la conexión a Firebase no está lista. Asegúrese de seleccionar un archivo y una carpeta.',
        });
        return;
    }

    setIsUploading(true);

    try {
        const pathParts = ['documentos', scope.areaId];
        if (scope.procesoId) pathParts.push(scope.procesoId);
        if (scope.subprocesoId) pathParts.push(scope.subprocesoId);
        pathParts.push(folderId);
        pathParts.push(selectedFile.name);
        const fullPath = pathParts.filter(Boolean).join('/');
        
        const fileStorageRef = storageRef(storage, fullPath);
        
        await uploadBytes(fileStorageRef, selectedFile);
        const url = await getDownloadURL(fileStorageRef);

        const formData = new FormData(event.currentTarget);
        formData.set('path', fullPath);
        formData.set('url', url);
        formData.set('size', String(selectedFile.size));

        // Now, call the server action with all the data
        formAction(formData);

    } catch (error: any) {
        console.error("Error during upload:", error);
        toast({
            variant: 'destructive',
            title: 'Error de Subida',
            description: `No se pudo subir el archivo: ${error.message}`,
        });
    } finally {
        setIsUploading(false);
    }
  };
  
  const isSubmitDisabled = isUploading || !selectedFile;


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
                />
            </div>
          </div>
          
            <Input type="hidden" name="folderId" value={folderId || ''} />
            <Input type="hidden" name="areaId" value={scope.areaId || ''} />
            <Input type="hidden" name="procesoId" value={scope.procesoId || ''} />
            <Input type="hidden" name="subprocesoId" value={scope.subprocesoId || ''} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
             <Button type="submit" disabled={isSubmitDisabled}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUploading ? 'Subiendo...' : 'Subir y Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
