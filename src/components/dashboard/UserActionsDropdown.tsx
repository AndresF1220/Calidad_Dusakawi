
'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, ToggleRight, ToggleLeft } from 'lucide-react';
import type { User } from '@/app/inicio/administracion/page';
import { EditUserForm } from './EditUserForm';

interface UserActionsDropdownProps {
  user: User;
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Editar usuario</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
             {user.status === 'active' ? <ToggleLeft className="mr-2 h-4 w-4" /> : <ToggleRight className="mr-2 h-4 w-4" />}
            <span>{user.status === 'active' ? 'Desactivar' : 'Activar'}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" disabled>
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
    </>
  );
}
