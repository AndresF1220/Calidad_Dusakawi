
'use server';

import { z } from 'zod';
import { collection, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import { SEED_AREAS } from '@/data/seed-map';


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
        return { message: 'Validation failed', error: errors.name?.join(', ') };
    }

    const { name, type, parentId, grandParentId } = validatedFields.data;

    try {
        let collectionPath = '';
        const data: any = {
            nombre: name,
            createdAt: serverTimestamp(),
        };
        let revalidationPath = '/inicio/documentos';

        if (type === 'area') {
            const newDocRef = await addDoc(collection(db, 'areas'), data);
            // Also create the root "Documentación" folder for this new area
            await addDoc(collection(db, 'folders'), {
              name: "Documentación",
              parentId: null,
              areaId: newDocRef.id,
              procesoId: null,
              subprocesoId: null,
              createdAt: serverTimestamp()
            });

        } else if (type === 'process' && parentId) {
            collectionPath = `areas/${parentId}/procesos`;
            await addDoc(collection(db, collectionPath), data);
            revalidationPath = `/inicio/documentos/${parentId}`;

        } else if (type === 'subprocess' && parentId && grandParentId) {
            collectionPath = `areas/${grandParentId}/procesos/${parentId}/subprocesos`;
            await addDoc(collection(db, collectionPath), data);
            revalidationPath = `/inicio/documentos/${grandParentId}/${parentId}`;
        } else {
            return { message: 'Error', error: 'Parámetros inválidos para la creación.' };
        }
        
        revalidatePath(revalidationPath);
        return { message: `${type} "${name}" creado con éxito.` };

    } catch (e: any) {
        console.error("Error creating entity:", e);
        return { message: 'Error', error: `No se pudo crear la entidad: ${e.message}` };
    }
}

export async function seedProcessMapAction(): Promise<{ message: string; error?: string }> {
    try {
        const batch = writeBatch(db);

        for (const area of SEED_AREAS) {
            const areaRef = collection(db, 'areas');
            const newAreaRef = await addDoc(areaRef, { nombre: area.titulo, createdAt: serverTimestamp() });
            
            // Create root folder for the area
            batch.set(collection(db, 'folders'), {
              name: "Documentación",
              parentId: null,
              areaId: newAreaRef.id,
              procesoId: null,
              subprocesoId: null,
              createdAt: serverTimestamp()
            });

            for (const proceso of area.procesos) {
                const procesoRef = collection(db, 'areas', newAreaRef.id, 'procesos');
                const newProcesoRef = await addDoc(procesoRef, { nombre: proceso.nombre, createdAt: serverTimestamp() });

                for (const subproceso of proceso.subprocesos) {
                    const subprocesoRef = collection(db, 'areas', newAreaRef.id, 'procesos', newProcesoRef.id, 'subprocesos');
                    batch.set(subprocesoRef, { nombre: subproceso.nombre, createdAt: serverTimestamp() });
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
