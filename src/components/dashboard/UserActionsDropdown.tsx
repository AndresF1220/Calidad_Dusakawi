
'use client';

import { useState, useTransition } from 'react';
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
import { MoreHorizontal, Edit, Trash2, ToggleRight, ToggleLeft, Loader2 } from 'lucide-react';
import type { User } from '@/app/inicio/administracion/page';
import { EditUserForm } from './EditUserForm';
import { toggleUserStatusAction, deleteUserAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface UserActionsDropdownProps {
  user: User;
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleToggleStatus = () => {
    const confirmation = confirm(`¿Está seguro de que desea ${user.status === 'active' ? 'desactivar' : 'activar'} a este usuario?`);
    if (!confirmation) return;
    
    startTransition(async () => {
      const result = await toggleUserStatusAction(user.id, user.status);
      if (result.success) {
        toast({ title: '¡Éxito!', description: `El estado del usuario ha sido actualizado.` });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
        const result = await deleteUserAction(user.id);
        if(result.success) {
            toast({ title: '¡Éxito!', description: 'Usuario eliminado correctamente.' });
            setIsDeleting(false);
        } else {
            toast({ variant: 'destructive', title: 'Error al Eliminar', description: result.error });
            setIsDeleting(false);
        }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
             {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Editar usuario</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleToggleStatus}>
             {user.status === 'active' ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
            <span>{user.status === 'active' ? 'Desactivar' : 'Activar'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsDeleting(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Eliminar usuario</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserForm
        user={user}
        isOpen={isEditing}
        onOpenChange={setIsEditing}
      >
        <div />
      </EditUserForm>

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar a este usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario "{user.fullName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
