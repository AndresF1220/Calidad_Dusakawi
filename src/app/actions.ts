'use server';

import {
  analyzeQualityData as analyzeQualityDataFlow,
  AnalyzeQualityDataInput,
  AnalyzeQualityDataOutput,
} from '@/ai/flows/analyze-quality-data';
import {
  suggestAdditionalData as suggestAdditionalDataFlow,
  SuggestAdditionalDataInput,
  SuggestAdditionalDataOutput,
} from '@/ai/flows/suggest-additional-data';
import { z } from 'zod';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { revalidatePath } from 'next/cache';

const analyzeSchema = z.object({
  qualityData: z.string().min(10, { message: "Please provide more detailed data for analysis."}),
});

export async function analyzeQualityDataAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; data?: AnalyzeQualityDataOutput, error?: string }> {
  const validatedFields = analyzeSchema.safeParse({
    qualityData: formData.get('qualityData'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      error: validatedFields.error.flatten().fieldErrors.qualityData?.join(', '),
    };
  }

  try {
    const result = await analyzeQualityDataFlow(validatedFields.data);
    return { message: 'Analysis complete.', data: result };
  } catch (e) {
    return { message: 'An error occurred during analysis.', error: (e as Error).message };
  }
}

const suggestSchema = z.object({
  currentAnalysis: z.string().min(10, { message: "Please provide a more detailed analysis."}),
  metricsUsed: z.string().min(3, { message: "Please list the metrics used."}),
});


export async function suggestAdditionalDataAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data?: SuggestAdditionalDataOutput, error?: string }> {
  const validatedFields = suggestSchema.safeParse({
    currentAnalysis: formData.get('currentAnalysis'),
    metricsUsed: formData.get('metricsUsed'),
  });

  if (!validatedFields.success) {
      const errors = validatedFields.error.flatten().fieldErrors;
      const errorString = Object.values(errors).map(e => e.join(', ')).join(' ');
    return {
      message: 'Validation failed.',
      error: errorString,
    };
  }
  
  try {
    const result = await suggestAdditionalDataFlow(validatedFields.data);
    return { message: 'Suggestion generated.', data: result };
  } catch (e) {
    return { message: 'An error occurred while generating suggestions.', error: (e as Error).message };
  }
}


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
            collectionPath = 'areas';
            const newDoc = await addDoc(collection(db, collectionPath), data);
            await addDoc(collection(db, 'folders'), {
              name: "Documentación",
              parentId: null,
              areaId: newDoc.id, 
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
