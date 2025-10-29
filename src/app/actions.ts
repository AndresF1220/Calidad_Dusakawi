
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
            const newAreaRef = await addDoc(collection(db, 'areas'), data);
            await addDoc(collection(db, 'folders'), {
              name: "Documentación",
              parentId: null,
              areaId: newAreaRef.id,
              procesoId: null,
              subprocesoId: null,
              createdAt: serverTimestamp()
            });

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
            
            const newFolderRef = doc(foldersCollection);
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
