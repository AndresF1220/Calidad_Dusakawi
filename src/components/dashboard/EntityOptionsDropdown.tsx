
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
import { RenameEntityForm } from './RenameEntityForm';

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
  
  const getDeleteMessage = () => {
    let message = `Vas a eliminar "${entityName}". Esta acción no se puede deshacer.`;
    if (entityType === 'area') {
      message += ' Todos los procesos y subprocesos asociados también serán eliminados.';
    } else if (entityType === 'process') {
      message += ' Todos los subprocesos asociados también serán eliminados.';
    }
    return message;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" data-radix-dropdown-menu-trigger>
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Editar Nombre</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsDeleting(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameEntityForm
        entityType={entityType}
        entityId={entityId}
        parentId={parentId}
        grandParentId={grandParentId}
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        initialName={entityName}
      />
      
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este elemento?</AlertDialogTitle>
            <AlertDialogDescription>
              {getDeleteMessage()}
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

    

    
