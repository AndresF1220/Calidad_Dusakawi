
'use server';

import { z } from 'zod';
import { collection, addDoc, serverTimestamp, writeBatch, doc, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import { SEED_AREAS } from '@/data/seed-map';
import { slugify } from '@/lib/slug';

const createSchema = z.object({
  name: z.string().min(3, 'Debe ingresar un nombre de al menos 3 caracteres.'),
  objetivo: z.string().optional().default(''),
  alcance: z.string().optional().default(''),
  responsable: z.string().optional().default(''),
  type: z.enum(['area', 'process', 'subprocess']),
  parentId: z.string().optional(),
  grandParentId: z.string().optional(),
});

export async function createEntityAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string }> {
    const s = (v: any) => (typeof v === 'string' ? v.trim() : '');
    
    const payload = {
        name: s(formData.get('name')),
        objetivo: s(formData.get('objetivo')),
        alcance: s(formData.get('alcance')),
        responsable: s(formData.get('responsable')),
        type: s(formData.get('type')) as 'area' | 'process' | 'subprocess',
        parentId: s(formData.get('parentId')),
        grandParentId: s(formData.get('grandParentId')),
    };
    
    const validatedFields = createSchema.safeParse(payload);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const errorMessages = Object.values(errors).map(err => err?.join(', ')).filter(Boolean);
        return { message: 'Validation failed', error: errorMessages.join(' ') || 'Debe ingresar un nombre.' };
    }

    const { name, objetivo, alcance, responsable, type, parentId, grandParentId } = validatedFields.data;

    try {
        const batch = writeBatch(db);

        const entityData: any = {
            nombre: name,
            slug: slugify(name),
            createdAt: serverTimestamp(),
        };
        
        let revalidationPath = '/inicio/documentos';
        let newEntityRef;
        let caracterizacionId = '';

        if (type === 'area') {
            newEntityRef = doc(collection(db, 'areas'));
            batch.set(newEntityRef, entityData);
            caracterizacionId = `area-${newEntityRef.id}`;
        } else if (type === 'process' && parentId) {
            newEntityRef = doc(collection(db, `areas/${parentId}/procesos`));
            batch.set(newEntityRef, entityData);
            caracterizacionId = `process-${newEntityRef.id}`;
            revalidationPath = `/inicio/documentos/area/${parentId}`;
        } else if (type === 'subprocess' && parentId && grandParentId) {
            newEntityRef = doc(collection(db, `areas/${grandParentId}/procesos/${parentId}/subprocesos`));
            batch.set(newEntityRef, entityData);
            caracterizacionId = `subprocess-${newEntityRef.id}`;
            revalidationPath = `/inicio/documentos/area/${grandParentId}/proceso/${parentId}`;
        } else {
            return { message: 'Error', error: 'Parámetros inválidos para la creación.' };
        }

        const caracterizacionRef = doc(db, 'caracterizaciones', caracterizacionId);
        batch.set(caracterizacionRef, {
            objetivo,
            alcance,
            responsable,
            fechaActualizacion: serverTimestamp(),
        });
        
        await batch.commit();
        
        revalidatePath(revalidationPath);
        return { message: `Creado correctamente.` };

    } catch (e: any) {
        console.error("Error creating entity:", e);
        return { message: 'Error', error: `No se pudo crear la entidad: ${e.message}` };
    }
}


const deleteSchema = z.object({
  entityId: z.string(),
  entityType: z.enum(['area', 'process', 'subprocess']),
  parentId: z.string().optional(),
  grandParentId: z.string().optional(),
});

export async function deleteEntityAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string }> {
  const validatedFields = deleteSchema.safeParse({
    entityId: formData.get('entityId'),
    entityType: formData.get('entityType'),
    parentId: formData.get('parentId'),
    grandParentId: formData.get('grandParentId'),
  });

  if (!validatedFields.success) {
    return { message: 'Error', error: 'Parámetros de eliminación inválidos.' };
  }

  const { entityId, entityType, parentId, grandParentId } = validatedFields.data;

  try {
    const batch = writeBatch(db);

    if (entityType === 'area') {
      const areaRef = doc(db, 'areas', entityId);
      const procesosSnap = await getDocs(collection(areaRef, 'procesos'));
      for (const procesoDoc of procesosSnap.docs) {
        const subprocesosSnap = await getDocs(collection(procesoDoc.ref, 'subprocesos'));
        subprocesosSnap.forEach(subDoc => batch.delete(subDoc.ref));
        batch.delete(procesoDoc.ref);
      }
      batch.delete(areaRef);
      revalidatePath('/inicio/documentos');
    } else if (entityType === 'process' && parentId) {
      const processRef = doc(db, `areas/${parentId}/procesos`, entityId);
      const subprocesosSnap = await getDocs(collection(processRef, 'subprocesos'));
      subprocesosSnap.forEach(subDoc => batch.delete(subDoc.ref));
      batch.delete(processRef);
      revalidatePath(`/inicio/documentos/area/${parentId}`);
    } else if (entityType === 'subprocess' && parentId && grandParentId) {
      const subProcessRef = doc(db, `areas/${grandParentId}/procesos/${parentId}/subprocesos`, entityId);
      batch.delete(subProcessRef);
      revalidatePath(`/inicio/documentos/area/${grandParentId}/proceso/${parentId}`);
    } else {
      return { message: 'Error', error: 'Parámetros inválidos para la eliminación.' };
    }

    await batch.commit();
    return { message: 'Elemento eliminado correctamente.' };
  } catch (e: any) {
    console.error('Error deleting entity:', e);
    return { message: 'Error', error: `No se pudo eliminar el elemento: ${e.message}` };
  }
}

const updateSchema = z.object({
  entityId: z.string(),
  entityType: z.enum(['area', 'process', 'subprocess']),
  parentId: z.string().optional(),
  grandParentId: z.string().optional(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  objetivo: z.string().optional(),
  alcance: z.string().optional(),
  responsable: z.string().optional(),
});

export async function updateEntityAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string }> {
    const validatedFields = updateSchema.safeParse({
        entityId: formData.get('entityId'),
        entityType: formData.get('entityType'),
        parentId: formData.get('parentId'),
        grandParentId: formData.get('grandParentId'),
        name: formData.get('name'),
        objetivo: formData.get('objetivo'),
        alcance: formData.get('alcance'),
        responsable: formData.get('responsable'),
    });

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        return { message: 'Validation failed', error: errors.name?.join(', ') || 'Error de validación.' };
    }
    
    const { entityId, entityType, parentId, grandParentId, name, objetivo, alcance, responsable } = validatedFields.data;

    try {
        const batch = writeBatch(db);

        let entityPath = '';
        let revalidationPath = '/inicio/documentos';

        if (entityType === 'area') {
            entityPath = `areas/${entityId}`;
        } else if (entityType === 'process' && parentId) {
            entityPath = `areas/${parentId}/procesos/${entityId}`;
            revalidationPath = `/inicio/documentos/area/${parentId}`;
        } else if (entityType === 'subprocess' && parentId && grandParentId) {
            entityPath = `areas/${grandParentId}/procesos/${parentId}/subprocesos/${entityId}`;
            revalidationPath = `/inicio/documentos/area/${grandParentId}/proceso/${parentId}`;
        } else {
            return { message: 'Error', error: 'Parámetros inválidos para la actualización.' };
        }

        const entityRef = doc(db, entityPath);
        batch.update(entityRef, { nombre: name, slug: slugify(name) });

        let caracterizacionId = `area-${entityId}`;
        if (entityType === 'process') {
            caracterizacionId = `process-${entityId}`;
        } else if (entityType === 'subprocess') {
           caracterizacionId = `subprocess-${entityId}`;
        }

        const caracterizacionRef = doc(db, 'caracterizaciones', caracterizacionId);
        batch.set(caracterizacionRef, {
            objetivo,
            alcance,
            responsable,
            fechaActualizacion: serverTimestamp(),
        }, { merge: true });

        await batch.commit();
        
        revalidatePath(revalidationPath);
        if (entityType !== 'area') {
          revalidatePath(`/inicio/documentos/area/${grandParentId || parentId}/proceso/${parentId}`);
          revalidatePath(`/inicio/documentos/area/${grandParentId || parentId}`);
        }
        
        return { message: `Cambios guardados correctamente.` };

    } catch (e: any) {
        console.error("Error updating entity:", e);
        return { message: 'Error', error: `No se pudo actualizar la entidad: ${e.message}` };
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

    

    
