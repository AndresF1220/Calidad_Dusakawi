
'use server';

import { z } from 'zod';
import { collection, addDoc, serverTimestamp, writeBatch, doc, getDocs, deleteDoc, setDoc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { db, storage } from '@/firebase/config';
import { revalidatePath } from 'next/cache';
import { SEED_AREAS } from '@/data/seed-map';
import { slugify } from '@/lib/slug';
import { deleteObject, ref } from 'firebase/storage';

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
        const newEntityRef = doc(collection(db, 'temp')); // Generate ID upfront
        entityData.id = newEntityRef.id;

        let finalEntityRef;
        let caracterizacionId = '';

        if (type === 'area') {
            finalEntityRef = doc(db, 'areas', newEntityRef.id);
            caracterizacionId = `area-${newEntityRef.id}`;
        } else if (type === 'process' && parentId) {
            finalEntityRef = doc(db, `areas/${parentId}/procesos`, newEntityRef.id);
            caracterizacionId = `process-${newEntityRef.id}`;
            revalidationPath = `/inicio/documentos/area/${parentId}`;
        } else if (type === 'subprocess' && parentId && grandParentId) {
            finalEntityRef = doc(db, `areas/${grandParentId}/procesos/${parentId}/subprocesos`, newEntityRef.id);
            caracterizacionId = `subprocess-${newEntityRef.id}`;
            revalidationPath = `/inicio/documentos/area/${grandParentId}/proceso/${parentId}`;
        } else {
            return { message: 'Error', error: 'Parámetros inválidos para la creación.' };
        }
        
        batch.set(finalEntityRef, entityData);

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
    const batch = writeBatch(db);
    let revalidationPath = '/inicio/documentos';

    switch (entityType) {
        case 'area':
            if (!entityId) throw new Error("Parámetros de eliminación inválidos (falta entityId).");
            
            const areaRef = doc(db, 'areas', entityId);
            const procesosQuery = collection(db, 'areas', entityId, 'procesos');
            const procesosSnap = await getDocs(procesosQuery);

            for (const procesoDoc of procesosSnap.docs) {
                const subprocesosQuery = collection(procesoDoc.ref, 'subprocesos');
                const subprocesosSnap = await getDocs(subprocesosQuery);
                for (const subDoc of subprocesosSnap.docs) {
                    const caracterizacionSubRef = doc(db, 'caracterizaciones', `subprocess-${subDoc.id}`);
                    batch.delete(caracterizacionSubRef);
                    batch.delete(subDoc.ref);
                }
                const caracterizacionProcRef = doc(db, 'caracterizaciones', `process-${procesoDoc.id}`);
                batch.delete(caracterizacionProcRef);
                batch.delete(procesoDoc.ref);
            }
            const caracterizacionAreaRef = doc(db, 'caracterizaciones', `area-${entityId}`);
            batch.delete(caracterizacionAreaRef);
            batch.delete(areaRef);
            revalidationPath = '/inicio/documentos';
            break;

        case 'process':
            if (!entityId || !parentId) throw new Error("Parámetros de eliminación inválidos (falta entityId o parentId).");

            const processRef = doc(db, `areas/${parentId}/procesos`, entityId);
            const subprocesosProcQuery = collection(processRef, 'subprocesos');
            const subprocesosProcSnap = await getDocs(subprocesosProcQuery);

            for (const subDoc of subprocesosProcSnap.docs) {
                const caracterizacionSubRef = doc(db, 'caracterizaciones', `subprocess-${subDoc.id}`);
                batch.delete(caracterizacionSubRef);
                batch.delete(subDoc.ref);
            }
            const caracterizacionProcRef = doc(db, 'caracterizaciones', `process-${entityId}`);
            batch.delete(caracterizacionProcRef);
            batch.delete(processRef);
            revalidationPath = `/inicio/documentos/area/${parentId}`;
            break;

        case 'subprocess':
            if (!entityId || !parentId || !grandParentId) throw new Error("Parámetros de eliminación inválidos (falta entityId, parentId o grandParentId).");
            
            const subProcessRef = doc(db, `areas/${grandParentId}/procesos/${parentId}/subprocesos`, entityId);
            const caracterizacionSubRef = doc(db, 'caracterizaciones', `subprocess-${entityId}`);
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

        if (objetivo !== undefined || alcance !== undefined || responsable !== undefined) {
            let caracterizacionId = `area-${entityId}`;
            if (entityType === 'process') {
                caracterizacionId = `process-${entityId}`;
            } else if (entityType === 'subprocess') {
               caracterizacionId = `subprocess-${entityId}`;
            }
            
            const caracterizacionData: any = { fechaActualizacion: serverTimestamp() };
            if (objetivo !== undefined) caracterizacionData.objetivo = objetivo;
            if (alcance !== undefined) caracterizacionData.alcance = alcance;
            if (responsable !== undefined) caracterizacionData.responsable = responsable;

            const caracterizacionRef = doc(db, 'caracterizaciones', caracterizacionId);
            const caracterizacionSnap = await getDoc(caracterizacionRef);

            if (caracterizacionSnap.exists()) {
                batch.update(caracterizacionRef, caracterizacionData);
            } else {
                batch.set(caracterizacionRef, caracterizacionData);
            }
        }


        await batch.commit();
        
        revalidatePath(revalidationPath);
        if (entityType !== 'area') {
          revalidatePath(`/inicio/documentos/area/${grandParentId || parentId}`);
        }
        revalidatePath(`/inicio/documentos`);
        
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
        const rootFolderCollection = collection(db, 'folders');

        for (const area of SEED_AREAS) {
            const newAreaRef = doc(areasCollection);
            batch.set(newAreaRef, { 
                nombre: area.titulo, 
                slug: slugify(area.titulo),
                id: newAreaRef.id,
                createdAt: serverTimestamp() 
            });

            for (const proceso of area.procesos) {
                const newProcesoRef = doc(collection(db, 'areas', newAreaRef.id, 'procesos'));
                batch.set(newProcesoRef, { 
                    nombre: proceso.nombre,
                    slug: slugify(proceso.nombre),
                    id: newProcesoRef.id,
                    createdAt: serverTimestamp() 
                });

                for (const subproceso of proceso.subprocesos) {
                    const newSubprocesoRef = doc(collection(db, 'areas', newAreaRef.id, 'procesos', newProcesoRef.id, 'subprocesos'));
                    batch.set(newSubprocesoRef, { 
                        nombre: subproceso.nombre,
                        slug: slugify(subproceso.nombre),
                        id: newSubprocesoRef.id,
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


const createFolderSchema = z.object({
  name: z.string().min(1, 'El nombre de la carpeta no puede estar vacío.'),
  parentId: z.string().nullable(),
  areaId: z.string().nullable(),
  procesoId: z.string().nullable(),
  subprocesoId: z.string().nullable(),
});

export async function createFolderAction(prevState: any, formData: FormData): Promise<{ message: string, error?: string }> {
    const s = (v: any): string | null => {
        const str = String(v);
        return (str === '' || str === 'null' || str === 'undefined' || v === null || v === undefined) ? null : str;
    };

    const payload = {
        name: formData.get('name') as string,
        parentId: s(formData.get('parentId')),
        areaId: s(formData.get('areaId')),
        procesoId: s(formData.get('procesoId')),
        subprocesoId: s(formData.get('subprocesoId')),
    };

    const validatedFields = createFolderSchema.safeParse(payload);

    if (!validatedFields.success) {
        console.error("Folder validation failed:", validatedFields.error.flatten());
        return { message: 'Error', error: 'Datos del formulario inválidos.' };
    }
    
    try {
        const docData = {
            ...validatedFields.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const newDocRef = await addDoc(collection(db, 'folders'), docData);
        
        console.log('Nueva carpeta creada', newDocRef.id, 'con datos:', docData);

        revalidatePath('/inicio/documentos');
        return { message: 'Carpeta creada con éxito.' };

    } catch(e:any) {
        console.error("Error creating folder:", e);
        return { message: 'Error', error: `No se pudo crear la carpeta: ${e.message}` };
    }
}

export async function deleteFolderAction(prevState: any, formData: FormData): Promise<{ message: string, error?: string, deletedFolderId?: string }> {
    const folderId = formData.get('folderId') as string;

    if (!folderId) {
        return { message: 'Error', error: 'ID de carpeta no proporcionado.' };
    }

    try {
        const batch = writeBatch(db);

        // 1. Delete all files within the folder from Storage and their documents from Firestore
        const filesQuery = query(collection(db, 'files'), where('folderId', '==', folderId));
        const filesSnap = await getDocs(filesQuery);

        for (const fileDoc of filesSnap.docs) {
            const fileData = fileDoc.data();
            if (fileData.path) {
                const fileRef = ref(storage, fileData.path);
                try {
                    await deleteObject(fileRef);
                } catch (storageError: any) {
                    // Ignore "object not found" errors, as it might have been deleted already
                    if (storageError.code !== 'storage/object-not-found') {
                        throw storageError;
                    }
                }
            }
            batch.delete(fileDoc.ref);
        }
        
        // 2. Delete the folder document itself
        const folderRef = doc(db, 'folders', folderId);
        batch.delete(folderRef);
        
        // 3. Commit the batch
        await batch.commit();

        revalidatePath('/inicio/documentos');
        return { message: 'Carpeta eliminada con éxito.', deletedFolderId: folderId };

    } catch (e: any) {
        console.error("Error deleting folder:", e);
        return { message: 'Error', error: `No se pudo eliminar la carpeta: ${e.message}` };
    }
}
