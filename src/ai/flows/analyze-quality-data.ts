'use server';

/**
 * @fileOverview Analyzes quality data, identifies trends and anomalies, and suggests areas for improvement.
 *
 * - analyzeQualityData - A function that triggers the analysis process.
 * - AnalyzeQualityDataInput - The input type for the analyzeQualityData function.
 * - AnalyzeQualityDataOutput - The return type for the analyzeQualityData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeQualityDataInputSchema = z.object({
  qualityData: z
    .string()
    .describe('The quality data to analyze, preferably in JSON format.'),
});

export type AnalyzeQualityDataInput = z.infer<typeof AnalyzeQualityDataInputSchema>;

const AnalyzeQualityDataOutputSchema = z.object({
  analysisSummary: z
    .string()
    .describe('A summary of the analysis, including identified trends and anomalies.'),
  improvementSuggestions: z
    .string()
    .describe('Suggested areas for improvement based on the analysis.'),
  additionalDataRequest: z
    .string()
    .optional()
    .describe('If the AI needs more data, specify the kind of data needed.'),
});

export type AnalyzeQualityDataOutput = z.infer<typeof AnalyzeQualityDataOutputSchema>;

export async function analyzeQualityData(
  input: AnalyzeQualityDataInput
): Promise<AnalyzeQualityDataOutput> {
  return analyzeQualityDataFlow(input);
}

const analyzeQualityDataPrompt = ai.definePrompt({
  name: 'analyzeQualityDataPrompt',
  input: {schema: AnalyzeQualityDataInputSchema},
  output: {schema: AnalyzeQualityDataOutputSchema},
  prompt: `You are an AI assistant for a quality manager. Analyze the following quality data to identify trends, anomalies, and potential areas for improvement.

Data: {{{qualityData}}}

Based on this analysis, provide a summary of your findings, suggest areas for improvement, and if you need more data to perform a more accurate analysis, ask for it specifically.

Follow the schema description when forming the output.`,
});

const analyzeQualityDataFlow = ai.defineFlow(
  {
    name: 'analyzeQualityDataFlow',
    inputSchema: AnalyzeQualityDataInputSchema,
    outputSchema: AnalyzeQualityDataOutputSchema,
  },
  async input => {
    const {output} = await analyzeQualityDataPrompt(input);
    return output!;
  }
);
