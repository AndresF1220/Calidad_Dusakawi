
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateUserAction } from '@/app/actions';
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
import { Loader2, Edit } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { User } from '@/app/inicio/administracion/page';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useAreas } from '@/hooks/use-areas-data';

interface EditUserFormProps {
  user: User;
  currentUserId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
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

const roleTranslations: Record<string, string> = {
    superadmin: 'Superadministrador',
    admin: 'Administrador',
    viewer: 'Visualizador',
};

const roleOptions = Object.keys(roleTranslations);

const initialState = {
  message: '',
  error: undefined,
  errors: {},
};


export function EditUserForm({
  user,
  currentUserId,
  isOpen,
  onOpenChange,
  children,
}: EditUserFormProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(updateUserAction, initialState);
  const [isActive, setIsActive] = useState(user.status === 'active');
  const isCurrentUser = user.id === currentUserId;

  const { areas, isLoading: isLoadingAreas } = useAreas();
  const [selectedAreaName, setSelectedAreaName] = useState(user.areaNombre || '');

  useEffect(() => {
    if (!state) return;
    if (state.message && !state.error) {
      toast({
        title: '¡Éxito!',
        description: state.message,
      });
      onOpenChange(false);
    }
    if (state.error && !state.errors) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar usuario',
        description: state.error,
      });
    }
  }, [state, toast, onOpenChange]);

  useEffect(() => {
    if (isOpen) {
        setIsActive(user.status === 'active');
        setSelectedAreaName(user.areaNombre || '');
    }
  }, [isOpen, user]);

  const getError = (fieldName: string) => state?.errors?.[fieldName]?.[0];
  
  const handleAreaChange = (areaId: string) => {
    const area = areas?.find(a => a.id === areaId);
    setSelectedAreaName(area?.nombre || '');
  }

  // Helper to safely provide default values to the form
  const safeUser = {
      fullName: user.fullName || '',
      cedula: user.cedula || '',
      email: user.email || '',
      tempPassword: user.tempPassword || '',
      role: user.role || 'viewer',
      areaId: user.areaId || ''
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit /> Editar Usuario
          </DialogTitle>
          <DialogDescription>
            Modifique los detalles del usuario. La contraseña temporal solo se actualizará en Firebase Auth si se cambia.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="grid gap-4 py-4" key={user.id}>
          <input type="hidden" name="userId" value={user.id} />
          
          <div className="grid gap-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" name="fullName" defaultValue={safeUser.fullName} />
            {getError('fullName') && <p className="text-xs text-destructive">{getError('fullName')}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cedula">Cédula</Label>
            <Input id="cedula" name="cedula" defaultValue={safeUser.cedula} />
            {getError('cedula') && <p className="text-xs text-destructive">{getError('cedula')}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" defaultValue={safeUser.email} />
            {getError('email') && <p className="text-xs text-destructive">{getError('email')}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tempPassword">Contraseña Temporal</Label>
            <Input id="tempPassword" name="tempPassword" defaultValue={safeUser.tempPassword} />
            {getError('tempPassword') && <p className="text-xs text-destructive">{getError('tempPassword')}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="areaId">Área</Label>
            <Select name="areaId" defaultValue={safeUser.areaId} onValueChange={handleAreaChange}>
              <SelectTrigger id="areaId" disabled={isLoadingAreas}>
                <SelectValue placeholder={isLoadingAreas ? "Cargando áreas..." : "Seleccione un área"} />
              </SelectTrigger>
              <SelectContent>
                {areas?.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getError('areaId') && <p className="text-xs text-destructive">{getError('areaId')}</p>}
            <input type="hidden" name="areaNombre" value={selectedAreaName} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Rol</Label>
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Select name="role" defaultValue={safeUser.role} disabled={isCurrentUser}>
                                <SelectTrigger id="role" aria-label={isCurrentUser ? 'No puede cambiar su propio rol' : 'Seleccione un rol'}>
                                    <SelectValue placeholder="Seleccione un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roleOptions.map(role => (
                                        <SelectItem key={role} value={role}>{roleTranslations[role]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TooltipTrigger>
                    {isCurrentUser && (
                        <TooltipContent>
                            <p>No puede cambiar su propio rol.</p>
                        </TooltipContent>
                    )}
                </Tooltip>
            </TooltipProvider>
             {getError('role') && <p className="text-xs text-destructive">{getError('role')}</p>}
          </div>
          <div className="grid gap-2">
            <Label>Estado</Label>
            <div className="flex items-center space-x-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <div className="flex items-center space-x-2">
                                <Switch
                                    id="status-switch"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    disabled={isCurrentUser}
                                    aria-label={isCurrentUser ? 'No puede desactivar su propio usuario' : (isActive ? 'Usuario activo' : 'Usuario inactivo')}
                                />
                                <Label htmlFor="status-switch" className="text-sm font-normal">
                                    {isActive ? 'Activo' : 'Inactivo'}
                                </Label>
                            </div>
                        </TooltipTrigger>
                         {isCurrentUser && (
                            <TooltipContent>
                                <p>No puede desactivar su propio usuario.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>

              <input type="hidden" name="status" value={isActive ? 'active' : 'inactive'} />
            </div>
            {getError('status') && <p className="text-xs text-destructive">{getError('status')}</p>}
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

    