
'use server';

import { z } from 'zod';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import { SEED_AREAS } from '@/data/seed-map';
import { slugify } from '@/lib/slug';

const createSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  type: z.enum(['area', 'process', 'subprocess']),
  parentId: z.string().optional(),
  grandParentId: z.string().optional(),
});

export async function createEntityAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string }> {
    const validatedFields = createSchema.safeParse({
        name: formData.get('name'),
        type: formData.get('type'),
        parentId: formData.get('parentId'),
        grandParentId: formData.get('grandParentId'),
    });

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        return { message: 'Validation failed', error: errors.name?.join(', ') || 'Error de validación.' };
    }

    const { name, type, parentId, grandParentId } = validatedFields.data;

    try {
        const data: any = {
            nombre: name,
            slug: slugify(name),
            createdAt: serverTimestamp(),
        };
        
        let revalidationPath = '/inicio/documentos';

        if (type === 'area') {
            await addDoc(collection(db, 'areas'), data);

        } else if (type === 'process' && parentId) {
            await addDoc(collection(db, `areas/${parentId}/procesos`), data);
            revalidationPath = `/inicio/documentos/area/${parentId}`;

        } else if (type === 'subprocess' && parentId && grandParentId) {
            await addDoc(collection(db, `areas/${grandParentId}/procesos/${parentId}/subprocesos`), data);
            revalidationPath = `/inicio/documentos/area/${grandParentId}/proceso/${parentId}`;
        } else {
            return { message: 'Error', error: 'Parámetros inválidos para la creación.' };
        }
        
        revalidatePath(revalidationPath);
        return { message: `Creado correctamente.` };

    } catch (e: any) {
        console.error("Error creating entity:", e);
        return { message: 'Error', error: `No se pudo crear la entidad: ${e.message}` };
    }
}

export async function seedProcessMapAction(): Promise<{ message: string; error?: string }> {
    try {
        const batch = writeBatch(db);
        const areasCollection = collection(db, 'areas');
        const foldersCollection = collection(db, 'folders');

        for (const area of SEED_AREAS) {
            const newAreaRef = doc(areasCollection);
            batch.set(newAreaRef, { 
                nombre: area.titulo, 
                slug: slugify(area.titulo),
                createdAt: serverTimestamp() 
            });
            
            const rootFolderKey = `root__${newAreaRef.id}____`;
            const newFolderRef = doc(foldersCollection, rootFolderKey);
            batch.set(newFolderRef, {
              name: "Documentación",
              parentId: null,
              areaId: newAreaRef.id,
              procesoId: null,
              subprocesoId: null,
              createdAt: serverTimestamp()
            });

            for (const proceso of area.procesos) {
                const newProcesoRef = doc(collection(db, 'areas', newAreaRef.id, 'procesos'));
                batch.set(newProcesoRef, { 
                    nombre: proceso.nombre,
                    slug: slugify(proceso.nombre),
                    createdAt: serverTimestamp() 
                });

                for (const subproceso of proceso.subprocesos) {
                    const newSubprocesoRef = doc(collection(db, 'areas', newAreaRef.id, 'procesos', newProcesoRef.id, 'subprocesos'));
                    batch.set(newSubprocesoRef, { 
                        nombre: subproceso.nombre,
                        slug: slugify(subproceso.nombre),
                        createdAt: serverTimestamp() 
                    });
                }
            }
        }

        await batch.commit();
        revalidatePath('/inicio/documentos');
        return { message: 'Mapa de procesos restaurado con éxito.' };
    } catch (e: any) {
        console.error("Error seeding process map:", e);
        return { message: 'Error', error: `No se pudo restaurar el mapa de procesos: ${e.message}` };
    }
}

export async function analyzeQualityDataAction(prevState: any, formData: FormData): Promise<{ message: string; error?: string, data?: any }> {
    // This function will be implemented in a future step.
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    console.log("Analyzing data:", formData.get('qualityData'));
     return { 
        message: 'Análisis completo',
        data: {
            analysisSummary: 'Se identificó una tendencia a la baja en la satisfacción del paciente durante el último trimestre, posiblemente correlacionada con un aumento en los tiempos de espera.',
            improvementSuggestions: 'Implementar un sistema de triaje más eficiente en emergencias y realizar encuestas de seguimiento post-consulta.',
            additionalDataRequest: 'Se necesitan datos sobre la proporción de personal por paciente y las tasas de finalización de capacitaciones del personal para un análisis más profundo.'
        }
    };
}


export async function suggestAdditionalDataAction(prevState: any, formData: FormData): Promise<{ message: string; error?: string, data?: any }> {
    // This function will be implemented in a future step.
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Suggesting data based on:", formData.get('currentAnalysis'), formData.get('metricsUsed'));
    return {
        message: 'Sugerencia generada',
        data: {
            suggestedDataPoints: '1. Tasa de rotación de personal de enfermería.\n2. Costo promedio por estancia hospitalaria.\n3. Cumplimiento de las guías de práctica clínica.',
            reasoning: 'La rotación de personal puede afectar la continuidad de la atención. El costo por estancia es un indicador clave de eficiencia. El cumplimiento de guías clínicas se relaciona directamente con la calidad y seguridad del paciente.'
        }
    };
}
