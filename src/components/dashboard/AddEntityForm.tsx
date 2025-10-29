
'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { createEntityAction } from '@/app/actions';
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

interface AddEntityFormProps {
  entityType: 'area' | 'process' | 'subprocess';
  parentId?: string;
  grandParentId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Guardar
    </Button>
  );
}

export function AddEntityForm({
  entityType,
  parentId,
  grandParentId,
  isOpen,
  onOpenChange,
  children,
}: AddEntityFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(createEntityAction, { message: '', error: undefined });
  
  const typeLabels = {
    area: { title: 'Nueva Área', description: 'Cree un nuevo macroproceso en el mapa.', field: 'Nombre del Área' },
    process: { title: 'Nuevo Proceso', description: 'Añada un proceso al área actual.', field: 'Nombre del Proceso' },
    subprocess: { title: 'Nuevo Subproceso', description: 'Añada un subproceso al proceso actual.', field: 'Nombre del Subproceso' },
  };

  const labels = typeLabels[entityType];

  useEffect(() => {
    if (state.message && !state.error) {
        toast({
            title: '¡Éxito!',
            description: state.message,
        });
        onOpenChange(false); // Close dialog on success
    }
    if (state.error) {
        toast({
            variant: 'destructive',
            title: 'Error al Crear',
            description: state.error,
        });
    }
  }, [state, toast, onOpenChange]);

  // Reset form state when dialog is closed
  useEffect(() => {
    if (!isOpen) {
        // Resetting form state is tricky with server actions.
        // A simple approach is to rely on re-mounting or key changes.
        // For now, we'll just close it.
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Nombre
                    </Label>
                    <Input id="name" name="name" className="col-span-3" placeholder={labels.field} />
                    <input type="hidden" name="type" value={entityType} />
                    {parentId && <input type="hidden" name="parentId" value={parentId} />}
                    {grandParentId && <input type="hidden" name="grandParentId" value={grandParentId} />}
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <SubmitButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
