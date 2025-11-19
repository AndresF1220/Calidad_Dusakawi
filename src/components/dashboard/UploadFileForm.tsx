'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirestore, useStorage } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

const formSchema = z.object({
  code: z.string().min(1, 'El código es requerido.'),
  name: z.string().min(3, 'El nombre es requerido.'),
  version: z.string().min(1, 'La versión es requerida.'),
  validityDate: z.date({
    required_error: 'La fecha de vigencia es requerida.',
  }),
  file: z
    .any()
    .refine((files) => files?.length == 1, 'El archivo es requerido.')
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      'Formato no válido. Solo PDF, Word, Excel, JPG o PNG.'
    ),
});

type UploadFormValues = z.infer<typeof formSchema>;

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
  const storage = useStorage();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      version: '',
      validityDate: undefined,
      file: undefined,
    }
  });

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;
  
  const selectedFile = watch('file');
  const fileName = selectedFile?.[0]?.name;

  useEffect(() => {
    if (!isOpen) {
        setTimeout(() => {
            reset();
        }, 150); 
    }
  }, [isOpen, reset]);


  const onSubmit = async (data: UploadFormValues) => {
    if (!folderId || !scope.areaId || !storage || !firestore) {
        toast({
            variant: "destructive",
            title: 'Error de Configuración',
            description: 'Falta información de la carpeta, área o conexión para subir el archivo.',
        });
        return;
    }
    
    setIsSubmitting(true);
    console.log("Paso 1: Iniciando subida de archivo...");
    
    try {
        const file = data.file[0] as File;
        
        const pathParts = ['documentos', scope.areaId];
        if (scope.procesoId) pathParts.push(scope.procesoId);
        if (scope.subprocesoId) pathParts.push(scope.subprocesoId);
        pathParts.push(folderId);
        pathParts.push(file.name);
        const storagePath = pathParts.join('/');
        
        const fileStorageRef = ref(storage, storagePath);

        const uploadResult = await uploadBytes(fileStorageRef, file);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        
        console.log("Paso 2: Archivo subido. URL obtenida:", downloadURL);


        const docData = {
          code: data.code,
          name: data.name,
          version: data.version,
          validityDate: data.validityDate,
          folderId: folderId,
          areaId: scope.areaId,
          procesoId: scope.procesoId || null,
          subprocesoId: scope.subprocesoId || null,
          url: downloadURL,
          path: storagePath,
          size: file.size,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(firestore, 'documents'), docData);
        
        console.log("Paso 3: Documento guardado en Firestore.");

        toast({
          title: '¡Éxito!',
          description: `El archivo "${file.name}" se ha subido y guardado correctamente.`,
        });

        onOpenChange(false);

    } catch(error: any) {
        console.error("Error detallado al subir archivo:", error);
        toast({
            variant: "destructive",
            title: 'Error al Subir',
            description: `No se pudo subir el archivo: ${error.message}`,
        });
    } finally {
        setIsSubmitting(false);
        console.log("Paso 4: Proceso finalizado. Estado de carga reseteado.");
    }
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setValue('validityDate', date, { shouldValidate: true });
      setIsCalendarOpen(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsCalendarOpen(open);
    if (!open) {
      form.trigger('validityDate');
    }
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
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Código del documento</Label>
            <Input id="code" {...form.register('code')} />
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del documento</Label>
            <Input id="name" {...form.register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="version">Versión</Label>
                <Input id="version" {...form.register('version')} />
                {errors.version && <p className="text-xs text-destructive">{errors.version.message}</p>}
            </div>
             <div className="grid gap-2">
                <Label htmlFor="validityDate">Fecha de vigencia</Label>
                <Popover open={isCalendarOpen} onOpenChange={handleOpenChange}>
                    <PopoverTrigger asChild>
                    <Button
                        variant={'outline'}
                        className={cn(
                        'w-full justify-start text-left font-normal',
                        !watch('validityDate') && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {watch('validityDate') ? (
                          format(watch('validityDate'), 'PPP', { locale: es })
                        ) : (
                          <span>Elija una fecha</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <CustomCalendar
                        mode="single"
                        selected={watch('validityDate')}
                        onDayClick={handleSelectDate}
                        initialFocus
                        locale={es}
                        onSelect={handleSelectDate}
                    />
                    </PopoverContent>
                </Popover>
                {errors.validityDate && <p className="text-xs text-destructive">{errors.validityDate.message}</p>}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="file-upload-button">Archivo (PDF, Word, Excel, JPG, PNG)</Label>
            <div className="flex items-center gap-4">
                <Button 
                    id="file-upload-button"
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Seleccionar archivo
                </Button>
                <span className="text-sm text-muted-foreground truncate">
                    {fileName || 'No hay archivo seleccionado'}
                </span>
                <Input 
                    id="file-upload" 
                    type="file" 
                    accept={ACCEPTED_FILE_TYPES.join(',')}
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      setValue('file', e.target.files, { shouldValidate: true });
                    }}
                />
            </div>
            {errors.file && <p className="text-xs text-destructive">{errors.file.message as string}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || Object.keys(errors).length > 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subir Documento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
