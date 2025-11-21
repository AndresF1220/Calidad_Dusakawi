
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { updateEntityAction } from '@/app/actions';


interface CaracterizacionEditorProps {
  entityId: string;
  entityType: 'area' | 'process' | 'subprocess' | 'proceso' | 'subproceso';
  onSaved: () => void;
  initialData: {
    objetivo?: string;
    alcance?: string;
    responsable?: string;
  }
}

// Validation schema with conditional rules
const formSchema = z.object({
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


type CaracterizacionFormValues = z.infer<typeof formSchema>;

export default function CaracterizacionEditor({ entityId, entityType, onSaved, initialData }: CaracterizacionEditorProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  let caracterizacionId: string;
    switch (entityType) {
        case 'area':
            caracterizacionId = `area-${entityId}`;
            break;
        case 'process':
        case 'proceso':
            caracterizacionId = `process-${entityId}`;
            break;
        case 'subprocess':
        case 'subproceso':
            caracterizacionId = `subprocess-${entityId}`;
            break;
        default:
            throw new Error('Invalid entity type for caracterizacion');
    }

  const form = useForm<CaracterizacionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objetivo: initialData.objetivo || '',
      alcance: initialData.alcance || '',
      responsable: initialData.responsable || '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form;
  

  useEffect(() => {
    reset({
      objetivo: initialData.objetivo || '',
      alcance: initialData.alcance || '',
      responsable: initialData.responsable || '',
    });
  }, [initialData, reset]);

  const onSubmit = async (data: CaracterizacionFormValues) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error de Conexión',
        description: 'No se pudo conectar a la base de datos.',
      });
      return;
    }
    
    const docRef = doc(firestore, 'caracterizaciones', caracterizacionId);

    const allFieldsEmpty = !data.objetivo && !data.alcance && !data.responsable;

    try {
      if (allFieldsEmpty) {
        // If all fields are empty, delete the document
        await deleteDoc(docRef);
        toast({
          title: '¡Caracterización Eliminada!',
          description: `Se ha eliminado la caracterización del ${entityType}.`,
        });
      } else {
        // Otherwise, update or create the document
        await setDoc(docRef, {
          ...data,
          fechaActualizacion: serverTimestamp(),
        }, { merge: true });

        toast({
          title: '¡Guardado!',
          description: `La caracterización del ${entityType} ha sido actualizada.`,
        });
      }
      onSaved();

    } catch (error) {
      console.error("Error guardando caracterización:", error);
      toast({
        variant: 'destructive',
        title: 'Error al Guardar',
        description: 'No se pudo guardar la caracterización. Por favor, inténtelo de nuevo.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="objetivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objetivo</FormLabel>
              <FormControl>
                <Textarea placeholder="Defina el propósito fundamental..." {...field} rows={4} />
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
              <FormLabel>Alcance</FormLabel>
              <FormControl>
                <Textarea placeholder="Describa los límites y el ámbito de aplicación..." {...field} rows={4} />
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
              <FormLabel>Responsable</FormLabel>
              <FormControl>
                <Input placeholder="Cargo o rol responsable" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onSaved} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
        </div>
      </form>
    </Form>
  );
}
