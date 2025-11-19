
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';

interface EditEntityFormProps {
  entityType: 'area' | 'process' | 'subprocess';
  entityId: string;
  parentId?: string;
  grandParentId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  initialData: {
    name: string;
    objetivo?: string;
    alcance?: string;
    responsable?: string;
  };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Guardar Cambios
    </Button>
  );
}

export function EditEntityForm({
  entityType,
  entityId,
  parentId,
  grandParentId,
  isOpen,
  onOpenChange,
  children,
  initialData,
}: EditEntityFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(updateEntityAction, { message: '', error: undefined });
  const formRef = useRef<HTMLFormElement>(null);
  
  const typeLabels = {
    area: { title: 'Área' },
    process: { title: 'Proceso' },
    subprocess: { title: 'Subproceso' },
  };

  const labels = typeLabels[entityType];
  const title = `Editar ${labels.title}`;
  const description = `Actualice el nombre y la caracterización de este ${entityType}.`;

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
            title: `Error al editar`,
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} key={`${entityId}-${isOpen}`}>
            <div className="grid gap-6 py-4">
                 <div className="grid gap-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input 
                        id="name" 
                        name="name" 
                        required 
                        minLength={3}
                        defaultValue={initialData.name}
                     />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="objetivo">Objetivo</Label>
                    <Textarea 
                        id="objetivo"
                        name="objetivo"
                        placeholder="Defina el propósito fundamental..."
                        rows={3}
                        defaultValue={initialData.objetivo}
                    />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="alcance">Alcance</Label>
                     <Textarea 
                        id="alcance"
                        name="alcance"
                        placeholder="Describa los límites y el ámbito de aplicación..."
                        rows={3}
                        defaultValue={initialData.alcance}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="responsable">Responsable</Label>
                    <Input 
                        id="responsable"
                        name="responsable"
                        placeholder="Cargo o rol responsable"
                        defaultValue={initialData.responsable}
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
