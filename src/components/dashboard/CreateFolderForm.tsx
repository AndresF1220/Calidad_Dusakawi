
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { createFolderAction } from '@/app/actions';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateFolderFormProps {
  parentId: string | null;
  scope: {
    areaId: string | null;
    procesoId?: string | null;
    subprocesoId?: string | null;
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Crear Carpeta
    </Button>
  );
}

export function CreateFolderForm({
  parentId,
  scope,
  isOpen,
  onOpenChange,
  children,
  disabled = false,
}: CreateFolderFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(createFolderAction, { message: '', error: undefined });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && !state.error) {
      toast({
        title: '¡Éxito!',
        description: state.message,
      });
      onOpenChange(false);
      formRef.current?.reset();
    }
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Error al Crear Carpeta',
        description: state.error,
      });
    }
  }, [state, toast, onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Carpeta</DialogTitle>
          <DialogDescription>
            Escriba un nombre para la nueva carpeta. Se creará dentro de la carpeta seleccionada actualmente.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la Carpeta</Label>
              <Input id="name" name="name" placeholder="Ej: Formatos Generales" required />
            </div>
            <input type="hidden" name="parentId" value={parentId || ''} />
            <input type="hidden" name="areaId" value={scope.areaId || ''} />
            <input type="hidden" name="procesoId" value={scope.procesoId || ''} />
            <input type="hidden" name="subprocesoId" value={scope.subprocesoId || ''} />
          </div>
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
