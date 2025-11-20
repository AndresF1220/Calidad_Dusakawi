
'use client';

import { useActionState, useEffect, useRef } from 'react';
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

export function CreateUserForm({
  isOpen,
  onOpenChange,
  children,
}: CreateUserFormProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createUserAction, { message: '', error: undefined });

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
        title: 'Error al Crear Usuario',
        description: state.error,
      });
    }
  }, [state, toast, onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen]);

  // A little hack to get the Switch's value into FormData
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const statusSwitch = form.querySelector<HTMLButtonElement>('[name="status-switch"]');
    const hiddenStatusInput = form.querySelector<HTMLInputElement>('[name="status"]');

    if (!statusSwitch || !hiddenStatusInput) return;

    // Set initial value
    hiddenStatusInput.value = statusSwitch.dataset.state === 'checked' ? 'active' : 'inactive';

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
                const state = (mutation.target as HTMLElement).dataset.state;
                hiddenStatusInput.value = state === 'checked' ? 'active' : 'inactive';
            }
        }
    });

    observer.observe(statusSwitch, { attributes: true });

    return () => observer.disconnect();
}, [isOpen]);

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
            <Input id="fullName" name="fullName" placeholder="John Doe" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" name="email" type="email" placeholder="john.doe@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Rol</Label>
            <Select name="role" defaultValue="viewer" required>
              <SelectTrigger id="role">
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Visualizador</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="superadmin">Superadministrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status-switch">Estado</Label>
             <div className="flex items-center space-x-2">
                 <Switch id="status-switch" name="status-switch" defaultChecked={true} />
                <Label htmlFor="status-switch" className="text-sm font-normal">
                    {/* Hidden input to submit the actual value */}
                    <input type="hidden" name="status" value={'active'} />
                    Activo
                </Label>
            </div>
             <p className="text-xs text-muted-foreground">Los usuarios inactivos no podrán iniciar sesión.</p>
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
