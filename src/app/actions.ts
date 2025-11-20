
'use client';

import { z } from 'zod';
import { db, storage } from '@/firebase/client-config';
import { collection, addDoc, doc, updateDoc, writeBatch, query, where, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { slugify } from '@/lib/slug';
import { SEED_AREAS } from '@/data/seed-map';


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
    if (!db) return { message: 'Error', error: 'Firestore no está inicializado.' };

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
        
        const newEntityRef = doc(collection(db, 'temp')); // Generate ID upfront
        entityData.id = newEntityRef.id;

        let finalEntityRef;
        let caracterizacionId = '';

        if (type === 'area') {
            finalEntityRef = doc(db, 'areas', newEntityRef.id);
            caracterizacionId = `area-${newEntityRef.id}`;
        } else if (type === 'process' && parentId) {
            finalEntityRef = doc(db, 'areas', parentId, 'procesos', newEntityRef.id);
            caracterizacionId = `process-${newEntityRef.id}`;
        } else if (type === 'subprocess' && parentId && grandParentId) {
            finalEntityRef = doc(db, 'areas', grandParentId, 'procesos', parentId, 'subprocesos', newEntityRef.id);
            caracterizacionId = `subprocess-${newEntityRef.id}`;
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
    if (!db) return { message: 'Error', error: 'Firestore no está inicializado.' };

  const entityId = formData.get('entityId') as string;
  const entityType = formData.get('entityType') as 'area' | 'process' | 'subprocess';
  const parentId = formData.get('parentId') as string | undefined;
  const grandParentId = formData.get('grandParentId') as string | undefined;

  try {
    const batch = writeBatch(db);

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
            break;

        case 'process':
            if (!entityId || !parentId) throw new Error("Parámetros de eliminación inválidos (falta entityId o parentId).");

            const processRef = doc(db, 'areas', parentId, 'procesos', entityId);
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
            break;

        case 'subprocess':
            if (!entityId || !parentId || !grandParentId) throw new Error("Parámetros de eliminación inválidos (falta entityId, parentId o grandParentId).");
            
            const subProcessRef = doc(db, 'areas', grandParentId, 'procesos', parentId, 'subprocesos', entityId);
            const caracterizacionSubRef = doc(db, 'caracterizaciones', `subprocess-${entityId}`);
            batch.delete(caracterizacionSubRef);
            batch.delete(subProcessRef);
            break;
        
        default:
            throw new Error("Tipo de entidad no reconocido.");
    }

    await batch.commit();
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
    if (!db) return { message: 'Error', error: 'Firestore no está inicializado.' };

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

        let entityRef;

        if (entityType === 'area') {
            entityRef = doc(db, 'areas', entityId);
        } else if (entityType === 'process' && parentId) {
            entityRef = doc(db, 'areas', parentId, 'procesos', entityId);
        } else if (entityType === 'subprocess' && parentId && grandParentId) {
            entityRef = doc(db, 'areas', grandParentId, 'procesos', parentId, 'subprocesos', entityId);
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
            
            const caracterizacionData: any = { fechaActualizacion: serverTimestamp() };
            if (objetivo !== undefined) caracterizacionData.objetivo = objetivo;
            if (alcance !== undefined) caracterizacionData.alcance = alcance;
            if (responsable !== undefined) caracterizacionData.responsable = responsable;

            const caracterizacionRef = doc(db, 'caracterizaciones', caracterizacionId);
            const caracterizacionSnap = await getDocs(query(collection(db, 'caracterizaciones'), where('__name__', '==', caracterizacionId)));


            if (!caracterizacionSnap.empty) {
                batch.update(caracterizacionRef, caracterizacionData);
            } else {
                batch.set(caracterizacionRef, caracterizacionData);
            }
        }


        await batch.commit();
        
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
  if (!db) return { message: 'Error', error: 'Firestore no está inicializado.' };
  
  const newName = formData.get('newName') as string;
  const folderId = formData.get('folderId') as string;

  if (!newName || newName.length < 3) {
    return { message: 'Error', error: 'El nombre debe tener al menos 3 caracteres.' };
  }
  if (!folderId) {
    return { message: 'Error', error: 'No se encontró el ID de la carpeta.' };
  }

  try {
    const folderRef = doc(db, 'folders', folderId);
    await updateDoc(folderRef, { name: newName });
    return { message: 'Carpeta renombrada con éxito.' };
  } catch (e: any) {
    console.error("Error renaming folder:", e);
    return { message: 'Error', error: `No se pudo renombrar la carpeta: ${e.message}` };
  }
}

export async function seedProcessMapAction(): Promise<{ message: string; error?: string }> {
    if (!db) return { message: 'Error', error: 'Firestore no está inicializado.' };

    try {
        const batch = writeBatch(db);
        const areasCollection = collection(db, 'areas');

        for (const area of SEED_AREAS) {
            const newAreaRef = doc(areasCollection);
            batch.set(newAreaRef, { 
                nombre: area.titulo, 
                slug: slugify(area.titulo),
                id: newAreaRef.id,
                createdAt: serverTimestamp() 
            });

            const procesosCollection = collection(newAreaRef, 'procesos');
            for (const proceso of area.procesos) {
                const newProcesoRef = doc(procesosCollection);
                batch.set(newProcesoRef, { 
                    nombre: proceso.nombre,
                    slug: slugify(proceso.nombre),
                    id: newProcesoRef.id,
                    createdAt: serverTimestamp() 
                });

                const subprocesosCollection = collection(newProcesoRef, 'subprocesos');
                for (const subproceso of proceso.subprocesos) {
                    const newSubprocesoRef = doc(subprocesosCollection);
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
  if (!db) return { message: 'Error', error: 'Firestore no está inicializado.' };
  
  const name = formData.get('name') as string;
  const parentId = formData.get('parentId') || null;
  const areaId = formData.get('areaId') as string | null;
  
  const getOrNull = (key: string) => {
    const value = formData.get(key);
    return value === '' ? null : value as string | null;
  };

  const procesoId = getOrNull('procesoId');
  const subprocesoId = getOrNull('subprocesoId');

  if (!name || name.length < 3) {
    return { message: 'Error', error: 'El nombre debe tener al menos 3 caracteres.' };
  }
   if (!areaId) {
    return { message: 'Error', error: 'El ID del área es requerido.' };
  }

  try {
    const docData = {
      name,
      parentId: parentId,
      areaId,
      procesoId: procesoId,
      subprocesoId: subprocesoId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'folders'), docData);
    return { message: 'Carpeta creada con éxito.' };
  } catch (e: any) {
    console.error("Error creating folder:", e);
    return { message: 'Error', error: `No se pudo crear la carpeta: ${e.message}` };
  }
}

export async function deleteFolderAction(folderId: string): Promise<{ success: boolean, error?: string }> {
  if (!db || !storage) {
    return { success: false, error: 'Firebase no está inicializado.' };
  }

  try {
    const batch = writeBatch(db);

    const filesQuery = query(collection(db, 'documents'), where('folderId', '==', folderId));
    const filesSnap = await getDocs(filesQuery);
    
    for (const fileDoc of filesSnap.docs) {
      const fileData = fileDoc.data();
      if (fileData.path) {
        const fileStorageRef = ref(storage, fileData.path);
        try {
          await deleteObject(fileStorageRef);
        } catch (storageError: any) {
          if (storageError.code !== 'storage/object-not-found') {
            throw storageError; 
          }
        }
      }
      batch.delete(fileDoc.ref);
    }
    
    const folderRef = doc(db, 'folders', folderId);
    batch.delete(folderRef);
    
    await batch.commit();

    return { success: true };
  } catch (e: any) {
    console.error("Error deleting folder and its contents:", e);
    return { success: false, error: e.message };
  }
}

export async function uploadFileAndCreateDocument(formData: FormData): Promise<{ success: boolean; error?: string }> {
  if (!db || !storage) {
    return { success: false, error: 'Firebase no está inicializado.' };
  }

  const selectedFile = formData.get('file') as File;
  const folderId = formData.get('folderId') as string;
  const areaId = formData.get('areaId') as string;
  const procesoId = formData.get('procesoId') as string | null;
  const subprocesoId = formData.get('subprocesoId') as string | null;

  if (!selectedFile || !folderId || !areaId) {
      return { success: false, error: "Faltan datos requeridos (archivo, folderId, areaId)." };
  }

  try {
    const pathParts = ['documentos', areaId, procesoId, subprocesoId, folderId, selectedFile.name].filter(Boolean);
    const fullPath = pathParts.join('/');
    const fileStorageRef = ref(storage, fullPath);

    const uploadResult = await uploadBytes(fileStorageRef, selectedFile);
    const url = await getDownloadURL(uploadResult.ref);

    const validityDateStr = formData.get('validityDate') as string;

    const docData = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      version: formData.get('version') as string,
      validityDate: validityDateStr ? new Date(validityDateStr) : null,
      folderId: folderId,
      areaId: areaId,
      procesoId: procesoId || null,
      subprocesoId: subprocesoId || null,
      path: fullPath,
      url: url,
      size: selectedFile.size,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'documents'), docData);

    return { success: true };
  } catch (e: any) {
    console.error('Error uploading file and creating document:', e);
    return { success: false, error: e.message };
  }
}

const userSchema = {
  fullName: z.string().min(3, 'El nombre completo es requerido.'),
  cedula: z.string().min(1, 'La cédula es requerida.'),
  email: z.string().email('El correo electrónico no es válido.'),
  role: z.enum(['superadmin', 'admin', 'viewer']),
  status: z.enum(['active', 'inactive']),
  tempPassword: z.string().min(1, 'La contraseña temporal es requerida.'),
};

const createUserSchema = z.object(userSchema);

export async function createUserAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string }> {
  if (!db) return { message: 'Error', error: 'Firestore no está inicializado.' };

  const validatedFields = createUserSchema.safeParse({
    fullName: formData.get('fullName'),
    cedula: formData.get('cedula'),
    email: formData.get('email'),
    role: formData.get('role'),
    status: formData.get('status'),
    tempPassword: formData.get('tempPassword'),
  });

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.values(errors).flat().join(' ');
    return { message: 'Error de validación', error: errorMessages };
  }

  try {
    const { fullName, email, role, status, cedula, tempPassword } = validatedFields.data;
    await addDoc(collection(db, 'users'), {
      fullName,
      email,
      cedula,
      role,
      status,
      tempPassword,
      createdAt: serverTimestamp(),
    });

    return { message: 'Usuario creado con éxito.' };
  } catch (e: any) {
    console.error('Error creando usuario:', e);
    return { message: 'Error', error: `No se pudo crear el usuario: ${e.message}` };
  }
}

const updateUserSchema = z.object({
  ...userSchema,
  userId: z.string().min(1, 'ID de usuario es requerido.'),
});

export async function updateUserAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string, errors?: { [key: string]: string[] } }> {
  if (!db) return { message: 'Error', error: 'Firestore no está inicializado.' };

  const validatedFields = updateUserSchema.safeParse({
    userId: formData.get('userId'),
    fullName: formData.get('fullName'),
    cedula: formData.get('cedula'),
    email: formData.get('email'),
    role: formData.get('role'),
    status: formData.get('status'),
    tempPassword: formData.get('tempPassword'),
  });
  
  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      message: 'Error de validación',
      errors: fieldErrors,
      error: Object.values(fieldErrors).flat().join(' '),
    };
  }

  try {
    const { userId, ...userData } = validatedFields.data;
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
    });

    return { message: 'Usuario actualizado con éxito.' };
  } catch (e: any) {
    console.error('Error actualizando usuario:', e);
    return { message: 'Error', error: `No se pudo actualizar el usuario: ${e.message}` };
  }
}
