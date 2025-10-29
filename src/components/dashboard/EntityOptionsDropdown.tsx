
'use client';

import { useState, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteEntityAction } from '@/app/actions';
import { EditEntityForm } from './EditEntityForm';
import { useCaracterizacion } from '@/hooks/use-areas-data';

interface EntityOptionsDropdownProps {
  entityId: string;
  entityName: string;
  entityType: 'area' | 'process' | 'subprocess';
  parentId?: string;
  grandParentId?: string;
  redirectOnDelete?: string;
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <AlertDialogAction asChild>
        <Button type="submit" variant="destructive" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar
        </Button>
    </AlertDialogAction>
  );
}

export function EntityOptionsDropdown({
  entityId,
  entityName,
  entityType,
  parentId,
  grandParentId,
  redirectOnDelete,
}: EntityOptionsDropdownProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [deleteState, deleteFormAction] = useActionState(deleteEntityAction, { message: '', error: undefined });

  let caracterizacionId = `${entityType}-${entityId}`;
  if(entityType === 'subproceso' && grandParentId && parentId) {
     caracterizacionId = `${entityType}-${grandParentId}:${parentId}:${entityId}`;
  }
  const { caracterizacion } = useCaracterizacion(caracterizacionId);

  useEffect(() => {
    if (deleteState.message && !deleteState.error) {
      toast({
        title: '¡Éxito!',
        description: deleteState.message,
      });
      setIsDeleting(false);
      if (redirectOnDelete) {
        router.push(redirectOnDelete);
      }
    }
    if (deleteState.error) {
      toast({
        variant: 'destructive',
        title: 'Error al Eliminar',
        description: deleteState.error,
      });
    }
  }, [deleteState, toast, router, redirectOnDelete]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Editar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsDeleting(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditEntityForm
        entityType={entityType}
        parentId={parentId}
        grandParentId={grandParentId}
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        entityId={entityId}
        initialData={{
          name: entityName,
          objetivo: caracterizacion?.objetivo || '',
          alcance: caracterizacion?.alcance || '',
          responsable: caracterizacion?.responsable || '',
        }}
      >
        <div />
      </EditEntityForm>
      
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este elemento?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar "{entityName}". Esta acción no se puede deshacer.
              {entityType === 'area' && ' Todos los procesos y subprocesos asociados también serán eliminados.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <form action={deleteFormAction}>
                <input type="hidden" name="entityId" value={entityId} />
                <input type="hidden" name="entityType" value={entityType} />
                {parentId && <input type="hidden" name="parentId" value={parentId} />}
                {grandParentId && <input type="hidden" name="grandParentId" value={grandParentId} />}
                <AlertDialogCancel asChild>
                     <Button type="button" variant="ghost">Cancelar</Button>
                </AlertDialogCancel>
                <DeleteButton />
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
