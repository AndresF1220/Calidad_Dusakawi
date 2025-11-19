
'use server';

import { z } from 'zod';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { db, storage } from '@/firebase/server-config';
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
        const batch = db.batch();

        const entityData: any = {
            nombre: name,
            slug: slugify(name),
            createdAt: FieldValue.serverTimestamp(),
        };
        
        let revalidationPath = '/inicio/documentos';
        const newEntityRef = db.collection('temp').doc(); // Generate ID upfront
        entityData.id = newEntityRef.id;

        let finalEntityRef;
        let caracterizacionId = '';

        if (type === 'area') {
            finalEntityRef = db.collection('areas').doc(newEntityRef.id);
            caracterizacionId = `area-${newEntityRef.id}`;
        } else if (type === 'process' && parentId) {
            finalEntityRef = db.collection('areas').doc(parentId).collection('procesos').doc(newEntityRef.id);
            caracterizacionId = `process-${newEntityRef.id}`;
            revalidationPath = `/inicio/documentos/area/${parentId}`;
        } else if (type === 'subprocess' && parentId && grandParentId) {
            finalEntityRef = db.collection('areas').doc(grandParentId).collection('procesos').doc(parentId).collection('subprocesos').doc(newEntityRef.id);
            caracterizacionId = `subprocess-${newEntityRef.id}`;
            revalidationPath = `/inicio/documentos/area/${grandParentId}/proceso/${parentId}`;
        } else {
            return { message: 'Error', error: 'Parámetros inválidos para la creación.' };
        }
        
        batch.set(finalEntityRef, entityData);

        const caracterizacionRef = db.collection('caracterizaciones').doc(caracterizacionId);
        batch.set(caracterizacionRef, {
            objetivo,
            alcance,
            responsable,
            fechaActualizacion: FieldValue.serverTimestamp(),
        });
        
        await batch.commit();
        
        revalidatePath(revalidationPath);
        return { message: `Creado correctamente.` };

    } catch (e: any) {
        console.error("Error creating entity:", e);
        return { message: 'Error', error: `No se pudo crear la entidad: ${e.message}` };
    }
}


export async function deleteEntityAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string }> {
  
  const entityId = formData.get('entityId') as string;
  const entityType = formData.get('entityType') as 'area' | 'process' | 'subprocess';
  const parentId = formData.get('parentId') as string | undefined;
  const grandParentId = formData.get('grandParentId') as string | undefined;

  console.log('[DEL] args', { entityType, entityId, parentId, grandParentId });
  
  try {
    const batch = db.batch();
    let revalidationPath = '/inicio/documentos';

    switch (entityType) {
        case 'area':
            if (!entityId) throw new Error("Parámetros de eliminación inválidos (falta entityId).");
            
            const areaRef = db.collection('areas').doc(entityId);
            const procesosQuery = db.collection('areas').doc(entityId).collection('procesos');
            const procesosSnap = await procesosQuery.get();

            for (const procesoDoc of procesosSnap.docs) {
                const subprocesosQuery = procesoDoc.ref.collection('subprocesos');
                const subprocesosSnap = await subprocesosQuery.get();
                for (const subDoc of subprocesosSnap.docs) {
                    const caracterizacionSubRef = db.collection('caracterizaciones').doc(`subprocess-${subDoc.id}`);
                    batch.delete(caracterizacionSubRef);
                    batch.delete(subDoc.ref);
                }
                const caracterizacionProcRef = db.collection('caracterizaciones').doc(`process-${procesoDoc.id}`);
                batch.delete(caracterizacionProcRef);
                batch.delete(procesoDoc.ref);
            }
            const caracterizacionAreaRef = db.collection('caracterizaciones').doc(`area-${entityId}`);
            batch.delete(caracterizacionAreaRef);
            batch.delete(areaRef);
            revalidationPath = '/inicio/documentos';
            break;

        case 'process':
            if (!entityId || !parentId) throw new Error("Parámetros de eliminación inválidos (falta entityId o parentId).");

            const processRef = db.collection('areas').doc(parentId).collection('procesos').doc(entityId);
            const subprocesosProcQuery = processRef.collection('subprocesos');
            const subprocesosProcSnap = await subprocesosProcQuery.get();

            for (const subDoc of subprocesosProcSnap.docs) {
                const caracterizacionSubRef = db.collection('caracterizaciones').doc(`subprocess-${subDoc.id}`);
                batch.delete(caracterizacionSubRef);
                batch.delete(subDoc.ref);
            }
            const caracterizacionProcRef = db.collection('caracterizaciones').doc(`process-${entityId}`);
            batch.delete(caracterizacionProcRef);
            batch.delete(processRef);
            revalidationPath = `/inicio/documentos/area/${parentId}`;
            break;

        case 'subprocess':
            if (!entityId || !parentId || !grandParentId) throw new Error("Parámetros de eliminación inválidos (falta entityId, parentId o grandParentId).");
            
            const subProcessRef = db.collection('areas').doc(grandParentId).collection('procesos').doc(parentId).collection('subprocesos').doc(entityId);
            const caracterizacionSubRef = db.collection('caracterizaciones').doc(`subprocess-${entityId}`);
            batch.delete(caracterizacionSubRef);
            batch.delete(subProcessRef);
            revalidationPath = `/inicio/documentos/area/${grandParentId}/proceso/${parentId}`;
            break;
        
        default:
            throw new Error("Tipo de entidad no reconocido.");
    }

    await batch.commit();
    revalidatePath(revalidationPath);
    return { message: 'Elemento eliminado correctamente.' };

  } catch (e: any) {
    let errorMessage = `No se pudo eliminar el elemento: ${e.message}`;
    console.error('Error deleting entity:', e);
    return { message: 'Error', error: errorMessage };
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
    const s = (v: any) => (v === null || v === undefined ? undefined : String(v));

    const payload = {
        entityId: s(formData.get('entityId')),
        entityType: s(formData.get('entityType')),
        parentId: s(formData.get('parentId')),
        grandParentId: s(formData.get('grandParentId')),
        name: s(formData.get('name')),
        objetivo: s(formData.get('objetivo')),
        alcance: s(formData.get('alcance')),
        responsable: s(formData.get('responsable')),
    };

    const validatedFields = updateSchema.safeParse(payload);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        return { message: 'Validation failed', error: errors.name?.join(', ') || 'Error de validación.' };
    }
    
    const { entityId, entityType, parentId, grandParentId, name, objetivo, alcance, responsable } = validatedFields.data;

    try {
        const batch = db.batch();

        let entityRef;

        if (entityType === 'area') {
            entityRef = db.collection('areas').doc(entityId);
        } else if (entityType === 'process' && parentId) {
            entityRef = db.collection('areas').doc(parentId).collection('procesos').doc(entityId);
        } else if (entityType === 'subprocess' && parentId && grandParentId) {
            entityRef = db.collection('areas').doc(grandParentId).collection('procesos').doc(parentId).collection('subprocesos').doc(entityId);
        } else {
            return { message: 'Error', error: 'Parámetros inválidos para la actualización.' };
        }

        batch.update(entityRef, { nombre: name, slug: slugify(name) });

        if (objetivo !== undefined || alcance !== undefined || responsable !== undefined) {
            let caracterizacionId = `area-${entityId}`;
            if (entityType === 'process') {
                caracterizacionId = `process-${entityId}`;
            } else if (entityType === 'subprocess') {
               caracterizacionId = `subprocess-${entityId}`;
            }
            
            const caracterizacionData: any = { fechaActualizacion: FieldValue.serverTimestamp() };
            if (objetivo !== undefined) caracterizacionData.objetivo = objetivo;
            if (alcance !== undefined) caracterizacionData.alcance = alcance;
            if (responsable !== undefined) caracterizacionData.responsable = responsable;

            const caracterizacionRef = db.collection('caracterizaciones').doc(caracterizacionId);
            const caracterizacionSnap = await caracterizacionRef.get();

            if (caracterizacionSnap.exists) {
                batch.update(caracterizacionRef, caracterizacionData);
            } else {
                batch.set(caracterizacionRef, caracterizacionData);
            }
        }


        await batch.commit();
        
        if (entityType === 'process') {
          revalidatePath(`/inicio/documentos/area/${parentId}`);
        } else if (entityType === 'subprocess') {
            revalidatePath(`/inicio/documentos/area/${grandParentId}/proceso/${parentId}`);
        }
        revalidatePath(`/inicio/documentos`);
        
        return { message: `Cambios guardados correctamente.` };

    } catch (e: any) {
        console.error("Error updating entity:", e);
        return { message: 'Error', error: `No se pudo actualizar la entidad: ${e.message}` };
    }
}

export async function renameFolderAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string }> {
  const newName = formData.get('newName') as string;
  const folderId = formData.get('folderId') as string;

  if (!newName || newName.length < 3) {
    return { message: 'Error', error: 'El nombre debe tener al menos 3 caracteres.' };
  }
  if (!folderId) {
    return { message: 'Error', error: 'No se encontró el ID de la carpeta.' };
  }

  try {
    const folderRef = db.collection('folders').doc(folderId);
    await folderRef.update({ name: newName });
    revalidatePath('/inicio/documentos', 'layout'); // Revalidate the whole documents layout
    return { message: 'Carpeta renombrada con éxito.' };
  } catch (e: any) {
    console.error("Error renaming folder:", e);
    return { message: 'Error', error: `No se pudo renombrar la carpeta: ${e.message}` };
  }
}

export async function seedProcessMapAction(): Promise<{ message: string; error?: string }> {
    try {
        const batch = db.batch();
        const areasCollection = db.collection('areas');

        for (const area of SEED_AREAS) {
            const newAreaRef = areasCollection.doc();
            batch.set(newAreaRef, { 
                nombre: area.titulo, 
                slug: slugify(area.titulo),
                id: newAreaRef.id,
                createdAt: FieldValue.serverTimestamp() 
            });

            for (const proceso of area.procesos) {
                const newProcesoRef = newAreaRef.collection('procesos').doc();
                batch.set(newProcesoRef, { 
                    nombre: proceso.nombre,
                    slug: slugify(proceso.nombre),
                    id: newProcesoRef.id,
                    createdAt: FieldValue.serverTimestamp() 
                });

                for (const subproceso of proceso.subprocesos) {
                    const newSubprocesoRef = newProcesoRef.collection('subprocesos').doc();
                    batch.set(newSubprocesoRef, { 
                        nombre: subproceso.nombre,
                        slug: slugify(subproceso.nombre),
                        id: newSubprocesoRef.id,
                        createdAt: FieldValue.serverTimestamp() 
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

export async function createFolderAction(prevState: any, formData: FormData): Promise<{ message: string; error?: string }> {
  const name = formData.get('name') as string;
  const parentId = formData.get('parentId') as string | null;
  const areaId = formData.get('areaId') as string | null;
  const procesoId = formData.get('procesoId') as string | null;
  const subprocesoId = formData.get('subprocesoId') as string | null;

  if (!name || name.length < 3) {
    return { message: 'Error', error: 'El nombre debe tener al menos 3 caracteres.' };
  }
   if (!areaId) {
    return { message: 'Error', error: 'El ID del área es requerido.' };
  }

  try {
    const docData = {
      name,
      parentId,
      areaId,
      procesoId,
      subprocesoId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await db.collection('folders').add(docData);
    revalidatePath('/inicio/documentos', 'layout');
    return { message: 'Carpeta creada con éxito.' };
  } catch (e: any) {
    console.error("Error creating folder:", e);
    return { message: 'Error', error: `No se pudo crear la carpeta: ${e.message}` };
  }
}
    

    