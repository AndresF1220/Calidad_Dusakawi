
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
import { MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import type { User } from '@/app/inicio/administracion/page';
import { EditUserForm } from './EditUserForm';
import { deleteUserAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface UserActionsDropdownProps {
  user: User;
  currentUserId: string | null;
}

export function UserActionsDropdown({ user, currentUserId }: UserActionsDropdownProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const isCurrentUser = user.id === currentUserId;

  const handleDelete = () => {
     if (isCurrentUser) {
        toast({
            variant: 'destructive',
            title: 'Acción no permitida',
            description: 'No puede eliminarse a sí mismo.',
        });
        setIsDeleting(false);
        return;
    }
    
    startTransition(async () => {
        const result = await deleteUserAction(currentUserId, user.id);
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsDeleting(true)} className="text-destructive focus:text-destructive" disabled={isCurrentUser}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Eliminar usuario</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserForm
        user={user}
        currentUserId={currentUserId}
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el usuario "{user.fullName}" de Firestore y de Firebase Authentication.
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
