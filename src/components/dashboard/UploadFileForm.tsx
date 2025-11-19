'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { createDocumentAction } from '@/app/actions';
import { useFirebase } from '@/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';


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
      Subir Documento
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
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(createDocumentAction, { message: '', error: undefined });
  
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
      setSelectedFile(null);
      setSelectedFileName('');
      setSelectedDate(undefined);
    }
  }, [isOpen]);
  
  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsCalendarOpen(open);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
          setSelectedFileName(e.target.files[0].name);
      } else {
          setSelectedFile(null);
          setSelectedFileName('');
      }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      if (!selectedFile || !folderId || !scope.areaId) {
          toast({ variant: 'destructive', title: 'Error', description: 'Faltan datos para la subida.'});
          return;
      }
      
      const formData = new FormData(formRef.current!);
      
      startTransition(async () => {
          try {
              toast({ title: 'Subiendo archivo...', description: 'Por favor espere.'});

              const pathParts = ['documentos', scope.areaId];
              if (scope.procesoId) pathParts.push(scope.procesoId);
              if (scope.subprocesoId) pathParts.push(scope.subprocesoId);
              pathParts.push(folderId);
              pathParts.push(selectedFile.name);
              const fullPath = pathParts.join('/');

              const fileStorageRef = storageRef(storage, fullPath);
              
              const uploadResult = await uploadBytes(fileStorageRef, selectedFile);
              const url = await getDownloadURL(uploadResult.ref);

              formData.append('url', url);
              formData.append('path', fullPath);
              formData.append('size', selectedFile.size.toString());

              formAction(formData);

          } catch (error: any) {
               console.error("File upload error:", error);
               toast({
                   variant: "destructive",
                   title: "Error de Subida",
                   description: `No se pudo subir el archivo: ${error.message}`
               });
          }
      });
  }

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
                <Popover open={isCalendarOpen} onOpenChange={handleOpenChange}>
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
          
            <Input type="hidden" name="folderId" value={folderId || ''} />
            <Input type="hidden" name="areaId" value={scope.areaId || ''} />
            <Input type="hidden" name="procesoId" value={scope.procesoId || ''} />
            <Input type="hidden" name="subprocesoId" value={scope.subprocesoId || ''} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
             <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subir Documento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
