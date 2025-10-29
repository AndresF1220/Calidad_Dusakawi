
'use client';

import { useActionState, useEffect, useRef } from 'react';
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
  isEditing?: boolean;
  entityId?: string;
  initialName?: string;
}

function SubmitButton({ isEditing }: { isEditing?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isEditing ? 'Guardar Cambios' : 'Crear'}
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
  isEditing = false,
  entityId,
  initialName = '',
}: AddEntityFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(createEntityAction, { message: '', error: undefined });
  const formRef = useRef<HTMLFormElement>(null);
  
  const typeLabels = {
    area: { title: 'Área', description: 'un nuevo macroproceso en el mapa.', field: 'Nombre del Área' },
    process: { title: 'Proceso', description: 'un proceso al área actual.', field: 'Nombre del Proceso' },
    subprocess: { title: 'Subproceso', description: 'un subproceso al proceso actual.', field: 'Nombre del Subproceso' },
  };

  const labels = typeLabels[entityType];
  const actionText = isEditing ? 'Editar' : 'Crear';
  const title = `${actionText} ${labels.title}`;
  const description = `${actionText} ${labels.description}`;

  useEffect(() => {
    if (state.message && !state.error) {
        toast({
            title: '¡Éxito!',
            description: state.message,
        });
        onOpenChange(false); // Close dialog on success
        formRef.current?.reset();
    }
    if (state.error) {
        toast({
            variant: 'destructive',
            title: `Error al ${actionText.toLowerCase()}`,
            description: state.error,
        });
    }
  }, [state, toast, onOpenChange, actionText]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Nombre
                    </Label>
                    <Input 
                        id="name" 
                        name="name" 
                        className="col-span-3" 
                        placeholder={labels.field} 
                        required 
                        minLength={3}
                        defaultValue={initialName}
                     />
                    <input type="hidden" name="type" value={entityType} />
                    {isEditing && entityId && <input type="hidden" name="entityId" value={entityId} />}
                    {parentId && <input type="hidden" name="parentId" value={parentId} />}
                    {grandParentId && <input type="hidden" name="grandParentId" value={grandParentId} />}
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <SubmitButton isEditing={isEditing} />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
