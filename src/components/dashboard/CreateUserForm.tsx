
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createUserAction } from '@/app/actions';
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
import { Loader2, UserPlus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface CreateUserFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Guardar Usuario
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
  errors: {},
  error: undefined,
};

export function CreateUserForm({
  isOpen,
  onOpenChange,
  children,
}: CreateUserFormProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createUserAction, initialState);
  const [isActive, setIsActive] = useState(true);

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
        title: 'Error al Crear Usuario',
        description: state.error,
      });
    }
  }, [state, toast, onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
      setIsActive(true);
    }
  }, [isOpen]);
  
  const getError = (fieldName: string) => state?.errors?.[fieldName]?.[0];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus /> Crear Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Complete los detalles para agregar un nuevo usuario al sistema.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" name="fullName" placeholder="Escriba el nombre completo" />
            {getError('fullName') && <p className="text-xs text-destructive">{getError('fullName')}</p>}
          </div>
           <div className="grid gap-2">
            <Label htmlFor="cedula">Cédula</Label>
            <Input id="cedula" name="cedula" placeholder="Escriba la cédula" />
             {getError('cedula') && <p className="text-xs text-destructive">{getError('cedula')}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" placeholder="nombre@ejemplo.com" />
            {getError('email') && <p className="text-xs text-destructive">{getError('email')}</p>}
          </div>
           <div className="grid gap-2">
            <Label htmlFor="tempPassword">Contraseña Temporal</Label>
            <Input id="tempPassword" name="tempPassword" placeholder="Defina una contraseña temporal" />
            {getError('tempPassword') && <p className="text-xs text-destructive">{getError('tempPassword')}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Rol</Label>
            <Select name="role" defaultValue="viewer">
              <SelectTrigger id="role">
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(role => (
                    <SelectItem key={role} value={role}>{roleTranslations[role]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getError('role') && <p className="text-xs text-destructive">{getError('role')}</p>}
          </div>
          <div className="grid gap-2">
            <Label>Estado</Label>
             <div className="flex items-center space-x-2">
                 <Switch 
                    id="status-switch" 
                    checked={isActive}
                    onCheckedChange={setIsActive}
                 />
                <Label htmlFor="status-switch" className="text-sm font-normal">
                    {isActive ? 'Activo' : 'Inactivo'}
                </Label>
                <input type="hidden" name="status" value={isActive ? 'active' : 'inactive'} />
            </div>
             <p className="text-xs text-muted-foreground">Los usuarios inactivos no podrán iniciar sesión.</p>
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
