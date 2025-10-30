
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { updateEntityAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface RenameEntityFormProps {
  entityType: 'area' | 'process' | 'subprocess';
  entityId: string;
  parentId?: string;
  grandParentId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
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

export function RenameEntityForm({
  entityType,
  entityId,
  parentId,
  grandParentId,
  isOpen,
  onOpenChange,
  initialName,
}: RenameEntityFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(updateEntityAction, { message: '', error: undefined });
  const formRef = useRef<HTMLFormElement>(null);
  
  const typeLabels = {
    area: { title: 'Área' },
    process: { title: 'Proceso' },
    subprocess: { title: 'Subproceso' },
  };

  const labels = typeLabels[entityType];
  const title = `Renombrar ${labels.title}`;
  const description = `Cambie el nombre de "${initialName}".`;

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
            title: `Error al renombrar`,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nuevo Nombre</Label>
                    <Input 
                        id="name" 
                        name="name" 
                        defaultValue={initialName}
                        required 
                        minLength={3}
                    />
                </div>
                 
                <input type="hidden" name="entityType" value={entityType} />
                <input type="hidden" name="entityId" value={entityId} />
                {parentId && <input type="hidden" name="parentId" value={parentId} />}
                {grandParentId && <input type="hidden" name="grandParentId" value={grandParentId} />}
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

    