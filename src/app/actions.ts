
'use server';

import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { slugify } from '@/lib/slug';
import { SEED_AREAS } from '@/data/seed-map';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';


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
    const { db: adminDb } = await import('@/firebase/server-config');
    if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

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
        const batch = adminDb.batch();

        const entityData: any = {
            nombre: name,
            slug: slugify(name),
            createdAt: new Date(),
        };
        
        const tempRef = adminDb.collection('temp').doc(); // Generate ID upfront
        entityData.id = tempRef.id;

        let finalEntityRef;
        let caracterizacionId = '';

        if (type === 'area') {
            finalEntityRef = adminDb.doc(`areas/${tempRef.id}`);
            caracterizacionId = `area-${tempRef.id}`;
        } else if (type === 'process' && parentId) {
            finalEntityRef = adminDb.doc(`areas/${parentId}/procesos/${tempRef.id}`);
            caracterizacionId = `process-${tempRef.id}`;
        } else if (type === 'subprocess' && parentId && grandParentId) {
            finalEntityRef = adminDb.doc(`areas/${grandParentId}/procesos/${parentId}/subprocesos/${tempRef.id}`);
            caracterizacionId = `subprocess-${tempRef.id}`;
        } else {
            return { message: 'Error', error: 'Parámetros inválidos para la creación.' };
        }
        
        batch.set(finalEntityRef, entityData);

        const caracterizacionRef = adminDb.doc(`caracterizaciones/${caracterizacionId}`);
        batch.set(caracterizacionRef, {
            objetivo,
            alcance,
            responsable,
            fechaActualizacion: new Date(),
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
    const { db: adminDb } = await import('@/firebase/server-config');
    if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

  const entityId = formData.get('entityId') as string;
  const entityType = formData.get('entityType') as 'area' | 'process' | 'subprocess';
  const parentId = formData.get('parentId') as string | undefined;
  const grandParentId = formData.get('grandParentId') as string | undefined;

  try {
    const batch = adminDb.batch();

    switch (entityType) {
        case 'area':
            if (!entityId) throw new Error("Parámetros de eliminación inválidos (falta entityId).");
            
            const areaRef = adminDb.doc(`areas/${entityId}`);
            const procesosQuery = adminDb.collection(`areas/${entityId}/procesos`);
            const procesosSnap = await procesosQuery.get();

            for (const procesoDoc of procesosSnap.docs) {
                const subprocesosQuery = procesoDoc.ref.collection('subprocesos');
                const subprocesosSnap = await subprocesosQuery.get();
                for (const subDoc of subprocesosSnap.docs) {
                    const caracterizacionSubRef = adminDb.doc(`caracterizaciones/subprocess-${subDoc.id}`);
                    batch.delete(caracterizacionSubRef);
                    batch.delete(subDoc.ref);
                }
                const caracterizacionProcRef = adminDb.doc(`caracterizaciones/process-${procesoDoc.id}`);
                batch.delete(caracterizacionProcRef);
                batch.delete(procesoDoc.ref);
            }
            const caracterizacionAreaRef = adminDb.doc(`caracterizaciones/area-${entityId}`);
            batch.delete(caracterizacionAreaRef);
            batch.delete(areaRef);
            break;

        case 'process':
            if (!entityId || !parentId) throw new Error("Parámetros de eliminación inválidos (falta entityId o parentId).");

            const processRef = adminDb.doc(`areas/${parentId}/procesos/${entityId}`);
            const subprocesosProcQuery = processRef.collection('subprocesos');
            const subprocesosProcSnap = await subprocesosProcQuery.get();

            for (const subDoc of subprocesosProcSnap.docs) {
                const caracterizacionSubRef = adminDb.doc(`caracterizaciones/subprocess-${subDoc.id}`);
                batch.delete(caracterizacionSubRef);
                batch.delete(subDoc.ref);
            }
            const caracterizacionProcRef = adminDb.doc(`caracterizaciones/process-${entityId}`);
            batch.delete(caracterizacionProcRef);
            batch.delete(processRef);
            break;

        case 'subprocess':
            if (!entityId || !parentId || !grandParentId) throw new Error("Parámetros de eliminación inválidos (falta entityId, parentId o grandParentId).");
            
            const subProcessRef = adminDb.doc(`areas/${grandParentId}/procesos/${parentId}/subprocesos/${entityId}`);
            const caracterizacionSubRef = adminDb.doc(`caracterizaciones/subprocess-${entityId}`);
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
    const { db: adminDb } = await import('@/firebase/server-config');
    if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

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
        const batch = adminDb.batch();

        let entityRef;

        if (entityType === 'area') {
            entityRef = adminDb.doc(`areas/${entityId}`);
        } else if (entityType === 'process' && parentId) {
            entityRef = adminDb.doc(`areas/${parentId}/procesos/${entityId}`);
        } else if (entityType === 'subprocess' && parentId && grandParentId) {
            entityRef = adminDb.doc(`areas/${grandParentId}/procesos/${parentId}/subprocesos/${entityId}`);
        } else {
            return { message: 'Error', error: 'Parámetros inválidos para la actualización.' };
        }

        batch.update(entityRef, { nombre: name, slug: slugify(name) });
        
        const allCaracterizacionFieldsEmpty = !objetivo && !alcance && !responsable;
        const hasCaracterizacionData = objetivo !== undefined || alcance !== undefined || responsable !== undefined;

        if (hasCaracterizacionData) {
            let caracterizacionId = `area-${entityId}`;
            if (entityType === 'process') {
                caracterizacionId = `process-${entityId}`;
            } else if (entityType === 'subprocess') {
               caracterizacionId = `subprocess-${entityId}`;
            }
            
            const caracterizacionRef = adminDb.doc(`caracterizaciones/${caracterizacionId}`);

            if (allCaracterizacionFieldsEmpty) {
                 batch.delete(caracterizacionRef);
            } else {
                const caracterizacionData: any = { fechaActualizacion: new Date() };
                if (objetivo !== undefined) caracterizacionData.objetivo = objetivo;
                if (alcance !== undefined) caracterizacionData.alcance = alcance;
                if (responsable !== undefined) caracterizacionData.responsable = responsable;
                
                const caracterizacionSnap = await caracterizacionRef.get();
                 if (caracterizacionSnap.exists) {
                    batch.update(caracterizacionRef, caracterizacionData);
                } else {
                    batch.set(caracterizacionRef, caracterizacionData);
                }
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
  const { db: adminDb } = await import('@/firebase/server-config');
  if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };
  
  const newName = formData.get('newName') as string;
  const folderId = formData.get('folderId') as string;

  if (!newName || newName.length < 3) {
    return { message: 'Error', error: 'El nombre debe tener al menos 3 caracteres.' };
  }
  if (!folderId) {
    return { message: 'Error', error: 'No se encontró el ID de la carpeta.' };
  }

  try {
    const folderRef = adminDb.doc(`folders/${folderId}`);
    await folderRef.update({ name: newName });
    return { message: 'Carpeta renombrada con éxito.' };
  } catch (e: any) {
    console.error("Error renaming folder:", e);
    return { message: 'Error', error: `No se pudo renombrar la carpeta: ${e.message}` };
  }
}

export async function seedProcessMapAction(): Promise<{ message: string; error?: string }> {
    const { db: adminDb } = await import('@/firebase/server-config');
    if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

    try {
        const batch = adminDb.batch();
        const areasCollection = adminDb.collection('areas');

        for (const area of SEED_AREAS) {
            const newAreaRef = areasCollection.doc();
            batch.set(newAreaRef, { 
                nombre: area.titulo, 
                slug: slugify(area.titulo),
                id: newAreaRef.id,
                createdAt: new Date()
            });

            const procesosCollection = newAreaRef.collection('procesos');
            for (const proceso of area.procesos) {
                const newProcesoRef = procesosCollection.doc();
                batch.set(newProcesoRef, { 
                    nombre: proceso.nombre,
                    slug: slugify(proceso.nombre),
                    id: newProcesoRef.id,
                    createdAt: new Date()
                });

                const subprocesosCollection = newProcesoRef.collection('subprocesos');
                for (const subproceso of proceso.subprocesos) {
                    const newSubprocesoRef = subprocesosCollection.doc();
                    batch.set(newSubprocesoRef, { 
                        nombre: subproceso.nombre,
                        slug: slugify(subproceso.nombre),
                        id: newSubprocesoRef.id,
                        createdAt: new Date()
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
  const { db: adminDb } = await import('@/firebase/server-config');
  if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

  const name = formData.get('name') as string;
  const areaId = formData.get('areaId') as string | null;

  const getOrNull = (key: string) => {
    const value = formData.get(key);
    return value === '' ? null : value as string | null;
  };

  const parentId = getOrNull('parentId');
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
      parentId,
      areaId,
      procesoId,
      subprocesoId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await adminDb.collection('folders').add(docData);
    return { message: 'Carpeta creada con éxito.' };
  } catch (e: any) {
    console.error("Error creating folder:", e);
    return { message: 'Error', error: `No se pudo crear la carpeta: ${e.message}` };
  }
}

export async function deleteFolderAction(folderId: string): Promise<{ success: boolean; error?: string }> {
  const { db: adminDb } = await import('@/firebase/server-config');
  if (!adminDb) {
    return { success: false, error: 'Firebase Admin no está inicializado.' };
  }

  try {
    const batch = adminDb.batch();

    const filesQuery = adminDb.collection('documents').where('folderId', '==', folderId);
    const filesSnap = await filesQuery.get();
    
    // Note: Deleting from Storage is not included here as storage is a client-side SDK instance.
    // This would require a separate setup for admin storage access.
    
    for (const fileDoc of filesSnap.docs) {
      batch.delete(fileDoc.ref);
    }
    
    const folderRef = adminDb.collection('folders').doc(folderId);
    batch.delete(folderRef);
    
    await batch.commit();

    return { success: true };
  } catch (e: any) {
    console.error("Error deleting folder and its contents:", e);
    return { success: false, error: e.message };
  }
}


export async function uploadFileAndCreateDocument(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const { db: adminDb } = await import('@/firebase/server-config');
  const { storage } = await import('@/firebase/client-config'); // Storage needs client instance for web uploads
  if (!storage || !adminDb) {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection('documents').add(docData);

    return { success: true };
  } catch (e: any) {
    console.error('Error uploading file and creating document:', e);
    return { success: false, error: e.message };
  }
}

const userFormSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es requerido.'),
  cedula: z.string().min(1, 'La cédula es requerida.'),
  email: z.string().email('El correo electrónico no es válido.'),
  role: z.enum(['superadmin', 'admin', 'viewer'], { required_error: 'Debe seleccionar un rol.'}),
  status: z.enum(['active', 'inactive']),
  tempPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

const createUserSchema = userFormSchema;

export async function createUserAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string, errors?: { [key: string]: string[] } }> {
  
  try {
    const { db: adminDb, adminApp } = await import('@/firebase/server-config');
    const validatedFields = createUserSchema.safeParse({
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
          error: "Por favor corrija los errores en el formulario.",
          errors: fieldErrors,
      };
    }

    const { fullName, email, role, status, cedula, tempPassword } = validatedFields.data;
    
    const auth = getAuth(adminApp);
    
    const userRecord = await auth.createUser({
      email: email,
      password: tempPassword,
      displayName: fullName,
    });
    
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      fullName,
      email,
      cedula,
      role,
      status,
      tempPassword,
      createdAt: new Date(),
    });

    return { message: 'Usuario creado con éxito en Auth y Firestore.' };
  } catch (e: any) {
    console.error('Error creando usuario:', e);
    
    let errorMessage = `No se pudo crear el usuario: ${e.message}`;
    if (e.code === 'auth/email-already-exists') {
        errorMessage = 'El correo electrónico ya está en uso por otro usuario.';
    } else if (e.code === 'auth/invalid-password') {
        errorMessage = 'La contraseña no es válida. Debe tener al menos 6 caracteres.';
    }

    return { message: 'Error', error: errorMessage };
  }
}

const updateUserSchema = userFormSchema.extend({
  userId: z.string().min(1, 'ID de usuario es requerido.'),
});

export async function updateUserAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string, errors?: { [key: string]: string[] } }> {

  try {
    const { db: adminDb, adminApp } = await import('@/firebase/server-config');
    const payload = {
      userId: formData.get('userId'),
      fullName: formData.get('fullName'),
      cedula: formData.get('cedula'),
      email: formData.get('email'),
      role: formData.get('role'),
      status: formData.get('status'),
      tempPassword: formData.get('tempPassword'),
    };
    
    const validatedFields = updateUserSchema.safeParse(payload);
    
    if (!validatedFields.success) {
      const fieldErrors = validatedFields.error.flatten().fieldErrors;
      return {
        message: 'Error de validación',
        errors: fieldErrors,
        error: "Por favor corrija los errores en el formulario.",
      };
    }

    const { userId, ...userData } = validatedFields.data;
    const auth = getAuth(adminApp);
    const userRef = adminDb.collection('users').doc(userId);
    
    const currentUserSnap = await userRef.get();
    if (!currentUserSnap.exists) {
        return { message: 'Error', error: 'El usuario que intenta actualizar no existe.' };
    }
    const currentUserData = currentUserSnap.data();
    
    await userRef.update({
        ...userData,
        updatedAt: new Date(),
    });
    
    const authUpdates: { email?: string; password?: string, displayName?:string } = {};

    if (currentUserData?.email !== userData.email) {
        authUpdates.email = userData.email;
    }
    if (userData.tempPassword && currentUserData?.tempPassword !== userData.tempPassword) {
        authUpdates.password = userData.tempPassword;
    }
    if(currentUserData?.fullName !== userData.fullName){
        authUpdates.displayName = userData.fullName;
    }

    if (Object.keys(authUpdates).length > 0) {
        await auth.updateUser(userId, authUpdates);
    }

    return { message: 'Usuario actualizado con éxito.' };
  } catch (e: any) {
    console.error('Error actualizando usuario:', e);
    let errorMessage = `No se pudo actualizar el usuario: ${e.message}`;
     if (e.code === 'auth/email-already-exists') {
        errorMessage = 'El correo electrónico ya está en uso por otro usuario.';
    }
    return { message: 'Error', error: errorMessage };
  }
}

export async function deleteUserAction(
  currentUserId: string | null,
  userIdToDelete: string
): Promise<{ success: boolean; error?: string }> {
  const { db: adminDb, adminApp } = await import('@/firebase/server-config');
  if (!adminDb) {
    return { success: false, error: 'Firestore Admin no está inicializado.' };
  }
  if (!currentUserId) {
    return { success: false, error: 'No se pudo identificar al usuario actual.' };
  }
  if (currentUserId === userIdToDelete) {
    return { success: false, error: 'No se puede eliminar a sí mismo.' };
  }

  try {
    const auth = getAuth(adminApp);
    const userToDeleteDocRef = adminDb.collection('users').doc(userIdToDelete);
    const userToDeleteDocSnap = await userToDeleteDocRef.get();

    if (userToDeleteDocSnap.exists && userToDeleteDocSnap.data()?.role === 'superadmin') {
      const usersRef = adminDb.collection('users');
      const superAdminQuery = usersRef.where('role', '==', 'superadmin');
      const superAdminSnapshot = await superAdminQuery.get();

      if (superAdminSnapshot.size <= 1) {
        return { success: false, error: 'No se puede eliminar al último superadministrador.' };
      }
    }

    try {
      await auth.deleteUser(userIdToDelete);
    } catch (authError: any) {
      if (authError.code !== 'auth/user-not-found') {
        console.warn("Error deleting user from Auth, but will proceed to delete from Firestore:", authError.message);
      }
    }

    await userToDeleteDocRef.delete();

    return { success: true };
  } catch (e: any) {
    console.error('Error eliminando usuario:', e);
    return { success: false, error: `No se pudo eliminar el usuario: ${e.message}` };
  }
}

const loginSchema = z.object({
  cedula: z.string().min(1, "La cédula es requerida."),
  password: z.string().min(1, "La contraseña es requerida."),
});

type LoginState = {
  status: "idle" | "success" | "error";
  error?: string;
  data?: {
    email: string;
    tempPassword: any;
  };
};

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    const { db: adminDb } = await import('@/firebase/server-config');
    const validatedFields = loginSchema.safeParse({
      cedula: formData.get("cedula"),
      password: formData.get("password"),
    });

    if (!validatedFields.success) {
      return { status: "error", error: "Cédula y contraseña son requeridos." };
    }

    const { cedula, password } = validatedFields.data;

    const usersRef = adminDb.collection("users");
    const q = usersRef.where("cedula", "==", cedula);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return { status: "error", error: "Cédula o contraseña incorrectos, o el usuario está inactivo." };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.status !== "active") {
      return { status: "error", error: "El usuario está inactivo." };
    }

    if (userData.tempPassword !== password) {
      return { status: "error", error: "Cédula o contraseña incorrectos, o el usuario está inactivo." };
    }

    return {
      status: "success",
      data: {
        email: userData.email,
        tempPassword: userData.tempPassword,
      },
    };
  } catch (e: any) {
    console.error("Error en loginAction:", e);
    return {
      status: "error",
      error: "Ocurrió un error en el servidor. Por favor, inténtelo de nuevo.",
    };
  }
}

    