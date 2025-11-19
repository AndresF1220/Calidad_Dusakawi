
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { uploadFileAction } from '@/app/actions';

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
        {pending ? 'Subiendo...' : 'Subir y Guardar'}
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
  const [state, formAction] = useActionState(uploadFileAction, { message: '', error: undefined });
  
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
      setSelectedFileName(file.name);
    } else {
      setSelectedFileName('');
    }
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
        <form action={formAction} ref={formRef} className="grid gap-4 py-4">
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
          
            <Input type="hidden" name="folderId" value={folderId || ''} />
            <Input type="hidden" name="areaId" value={scope.areaId || ''} />
            <Input type="hidden" name="procesoId" value={scope.procesoId || ''} />
            <Input type="hidden" name="subprocesoId" value={scope.subprocesoId || ''} />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
             <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    