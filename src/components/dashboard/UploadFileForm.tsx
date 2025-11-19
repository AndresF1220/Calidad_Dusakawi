
'use client';

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
      (files) => files?.[0]?.type === 'application/pdf',
      'Solo se aceptan archivos PDF.'
    ),
});

type UploadFormValues = z.infer<typeof formSchema>;

interface UploadFileFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function UploadFileForm({
  isOpen,
  onOpenChange,
  children,
  disabled = false,
}: UploadFileFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(formSchema),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;
  
  const selectedFile = watch('file');
  const fileName = selectedFile?.[0]?.name;


  const onSubmit = async (data: UploadFormValues) => {
    setIsSubmitting(true);
    console.log('Form data submitted:', data);

    // Simulate an API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: 'Datos recibidos correctamente',
      description: 'El formulario de subida de archivos funciona.',
    });

    setIsSubmitting(false);
    onOpenChange(false);
    form.reset();
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
            Complete la información del documento y seleccione el archivo PDF para subir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Código del documento</Label>
            <Input id="code" {...register('code')} />
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Nombre del documento</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="version">Versión</Label>
                <Input id="version" {...register('version')} />
                {errors.version && <p className="text-xs text-destructive">{errors.version.message}</p>}
            </div>
             <div className="grid gap-2">
                <Label htmlFor="validityDate">Fecha de vigencia</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
                        onSelect={(date) => {
                            setValue('validityDate', date as Date, { shouldValidate: true });
                            setIsCalendarOpen(false);
                        }}
                        initialFocus
                        locale={es}
                    />
                    </PopoverContent>
                </Popover>
                {errors.validityDate && <p className="text-xs text-destructive">{errors.validityDate.message}</p>}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>Archivo (PDF)</Label>
             <div className="flex items-center gap-4">
                <Button 
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
                    accept=".pdf" 
                    {...register('file')}
                    ref={fileInputRef} 
                    className="hidden"
                />
            </div>
            {errors.file && <p className="text-xs text-destructive">{errors.file.message as string}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subir Documento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
