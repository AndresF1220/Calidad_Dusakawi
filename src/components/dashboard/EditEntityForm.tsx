
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { updateEntityAction } from '@/app/actions';
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
import { Textarea } from '../ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';

const formSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  objetivo: z.string().optional(),
  alcance: z.string().optional(),
  responsable: z.string().optional(),
}).superRefine((data, ctx) => {
    const { objetivo, alcance, responsable } = data;
    const someFieldFilled = objetivo || alcance || responsable;

    // If any field is filled, all must meet the requirements.
    if (someFieldFilled) {
        if (!objetivo || objetivo.length < 10) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['objetivo'],
            message: 'El objetivo debe tener al menos 10 caracteres.',
        });
        }
        if (!alcance || alcance.length < 10) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['alcance'],
            message: 'El alcance debe tener al menos 10 caracteres.',
        });
        }
        if (!responsable) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['responsable'],
            message: 'El responsable es requerido.',
        });
        }
    }
});


interface EditEntityFormProps {
  entityType: 'area' | 'process' | 'subprocess';
  entityId: string;
  parentId?: string;
  grandParentId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  initialData: {
    name: string;
    objetivo?: string;
    alcance?: string;
    responsable?: string;
  };
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

export function EditEntityForm({
  entityType,
  entityId,
  parentId,
  grandParentId,
  isOpen,
  onOpenChange,
  children,
  initialData,
}: EditEntityFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(updateEntityAction, { message: '', error: undefined });
  const formRef = useRef<HTMLFormElement>(null);
  
  const typeLabels = {
    area: { title: 'Área' },
    process: { title: 'Proceso' },
    subprocess: { title: 'Subproceso' },
  };

  const labels = typeLabels[entityType];
  const title = `Editar ${labels.title}`;
  const description = `Actualice el nombre y la caracterización de este ${entityType}. Para borrar la caracterización, deje todos sus campos en blanco.`;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: initialData.name,
        objetivo: initialData.objetivo || '',
        alcance: initialData.alcance || '',
        responsable: initialData.responsable || '',
    },
  });

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
            title: `Error al editar`,
            description: state.error,
        });
    }
  }, [state, toast, onOpenChange]);

  useEffect(() => {
    if (isOpen) {
        form.reset({
            name: initialData.name,
            objetivo: initialData.objetivo || '',
            alcance: initialData.alcance || '',
            responsable: initialData.responsable || '',
        });
    }
  }, [isOpen, initialData, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form 
                action={formAction} 
                ref={formRef} 
                key={`${entityId}-${isOpen}`}
                onSubmit={form.handleSubmit(() => {
                    const formData = new FormData(formRef.current!);
                    // Manually append hidden fields
                    formData.append('entityType', entityType);
                    formData.append('entityId', entityId);
                    if (parentId) formData.append('parentId', parentId);
                    if (grandParentId) formData.append('grandParentId', grandParentId);

                    const formValues = form.getValues();
                    formData.set('name', formValues.name);
                    formData.set('objetivo', formValues.objetivo || '');
                    formData.set('alcance', formValues.alcance || '');
                    formData.set('responsable', formValues.responsable || '');

                    (formAction as any)(formData);
                })}
            >
                <div className="grid gap-6 py-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <Label>Nombre</Label>
                            <FormControl>
                                <Input {...field} required minLength={3} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="objetivo"
                        render={({ field }) => (
                            <FormItem>
                            <Label>Objetivo</Label>
                            <FormControl>
                                <Textarea placeholder="Defina el propósito fundamental..." rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="alcance"
                        render={({ field }) => (
                            <FormItem>
                            <Label>Alcance</Label>
                            <FormControl>
                                <Textarea placeholder="Describa los límites y el ámbito de aplicación..." rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="responsable"
                        render={({ field }) => (
                            <FormItem>
                            <Label>Responsable</Label>
                            <FormControl>
                                <Input placeholder="Cargo o rol responsable" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <input type="hidden" name="entityType" value={entityType} />
                    <input type="hidden" name="entityId" value={entityId} />
                    {parentId && <input type="hidden" name="parentId" value={parentId} />}
                    {grandParentId && <input type="hidden" name="grandParentId" value={grandParentId} />}
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <SubmitButton />
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

