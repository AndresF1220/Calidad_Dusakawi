
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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

interface CaracterizacionEditorProps {
  idEntidad: string;
  tipo: 'area' | 'proceso' | 'subproceso';
  onSaved: () => void;
}

const formSchema = z.object({
  objetivo: z.string().min(10, 'El objetivo debe tener al menos 10 caracteres.'),
  alcance: z.string().min(10, 'El alcance debe tener al menos 10 caracteres.'),
  responsable: z.string().min(1, 'El responsable es requerido.'),
});

type CaracterizacionFormValues = z.infer<typeof formSchema>;

export default function CaracterizacionEditor({ idEntidad, tipo, onSaved }: CaracterizacionEditorProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  let caracterizacionId = `area-${idEntidad}`;
   if (tipo === 'proceso') {
     caracterizacionId = `process-${idEntidad}`;
   } else if (tipo === 'subproceso') {
     caracterizacionId = `subprocess-${idEntidad}`;
   }


  const form = useForm<CaracterizacionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objetivo: '',
      alcance: '',
      responsable: '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isLoading },
  } = form;
  

  useEffect(() => {
    if (!firestore) return;
    const docRef = doc(firestore, 'caracterizaciones', caracterizacionId);

    const fetchCaracterizacion = async () => {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        reset({
          objetivo: data.objetivo || '',
          alcance: data.alcance || '',
          responsable: data.responsable || '',
        });
      }
    };
    fetchCaracterizacion();
  }, [firestore, caracterizacionId, reset]);

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

    try {
      await setDoc(docRef, {
        ...data,
        idEntidad,
        tipo,
        fechaActualizacion: serverTimestamp(),
      }, { merge: true });

      toast({
        title: '¡Guardado!',
        description: `La caracterización del ${tipo} ha sido actualizada.`,
      });
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

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
