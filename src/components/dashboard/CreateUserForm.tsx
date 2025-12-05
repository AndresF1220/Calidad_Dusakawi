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
import { HierarchicalSelector, type HierarchyItem } from './HierarchicalSelector';

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

type FormKeys = 'fullName' | 'cedula' | 'email' | 'tempPassword' | 'areaId' | 'role' | 'status';

const initialState: { message: string; error?: string; errors?: Partial<Record<FormKeys, string[]>> } = {
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
  const [state, formAction] = useActionState(createUserAction, initialState);
  const [isActive, setIsActive] = useState(true);
  const [selectedHierarchy, setSelectedHierarchy] = useState<HierarchyItem | null>(null);
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [mustChangePassword, setMustChangePassword] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
      setIsActive(true);
      setSelectedHierarchy(null);
      setSelectedRole('viewer');
      setMustChangePassword(true);
      initialState.errors = {};
      initialState.error = undefined;
      initialState.message = '';
    }
  }, [isOpen]);

  useEffect(() => {
    if (state.message && !state.error) {
      toast({
        title: '¡Éxito!',
        description: state.message,
      });
      onOpenChange(false);
    } else if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Error al Crear Usuario',
        description: state.error,
      });
    }
  }, [state, toast, onOpenChange]);
  
  const getError = (fieldName: FormKeys) => {
    return state.errors?.[fieldName]?.[0];
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    if (value === 'viewer') {
      setMustChangePassword(true);
    } else {
      setMustChangePassword(false);
    }
  };

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
            <Label htmlFor="tempPassword">Contraseña</Label>
            <Input id="tempPassword" name="tempPassword" placeholder={selectedRole === 'viewer' ? 'Contraseña común (ej: 123456)' : 'Mínimo 6 caracteres'} />
            {getError('tempPassword') && <p className="text-xs text-destructive">{getError('tempPassword')}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Área</Label>
            <HierarchicalSelector
              selectedItem={selectedHierarchy}
              onSelectItem={setSelectedHierarchy}
            />
            {getError('areaId') && <p className="text-xs text-destructive">{getError('areaId')}</p>}
            <input type="hidden" name="areaId" value={selectedHierarchy?.areaId || ''} />
            <input type="hidden" name="areaNombre" value={selectedHierarchy?.areaNombre || ''} />
            <input type="hidden" name="procesoId" value={selectedHierarchy?.procesoId || ''} />
            <input type="hidden" name="procesoNombre" value={selectedHierarchy?.procesoNombre || ''} />
            <input type="hidden" name="subprocesoId" value={selectedHierarchy?.subprocesoId || ''} />
            <input type="hidden" name="subprocesoNombre" value={selectedHierarchy?.subprocesoNombre || ''} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Rol</Label>
            <Select name="role" defaultValue="viewer" onValueChange={handleRoleChange}>
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
            {selectedRole === 'viewer' && (
                <div className="grid gap-2">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="must-change-password-switch"
                            checked={mustChangePassword}
                            onCheckedChange={setMustChangePassword}
                        />
                        <Label htmlFor="must-change-password-switch" className="text-sm font-normal">
                            Forzar cambio de contraseña al primer inicio de sesión
                        </Label>
                    </div>
                </div>
            )}
            <input type="hidden" name="mustChangePassword" value={mustChangePassword.toString()} />
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
