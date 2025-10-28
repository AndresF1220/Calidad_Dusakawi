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
