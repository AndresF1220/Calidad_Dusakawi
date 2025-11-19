
'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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

interface CreateFolderFormProps {
  parentId: string | null;
  scope: {
    areaId: string | null;
    procesoId?: string | null;
    subprocesoId?: string | null;
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Crear Carpeta
    </Button>
  );
}

export function CreateFolderForm({
  parentId,
  scope,
  isOpen,
  onOpenChange,
  children,
  disabled = false,
}: CreateFolderFormProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const { firestore } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Firebase no está listo.' });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;

    const s = (v: any): string | null => {
        const str = String(v);
        return (str === '' || str === 'null' || str === 'undefined' || v === null || v === undefined) ? null : str;
    };
    
    const docData = {
        name: name,
        parentId: s(parentId),
        areaId: s(scope.areaId),
        procesoId: s(scope.procesoId),
        subprocesoId: s(scope.subprocesoId),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'folders'), docData);
      toast({
        title: '¡Éxito!',
        description: 'Carpeta creada con éxito.',
      });
      onOpenChange(false);
    } catch (e: any) {
      console.error("Error creating folder:", e);
      toast({
        variant: 'destructive',
        title: 'Error al Crear Carpeta',
        description: `No se pudo crear la carpeta: ${e.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Carpeta</DialogTitle>
          <DialogDescription>
            Escriba un nombre para la nueva carpeta. Se creará en el nivel actual.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la Carpeta</Label>
              <Input id="name" name="name" placeholder="Ej: Formatos Generales" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Carpeta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
