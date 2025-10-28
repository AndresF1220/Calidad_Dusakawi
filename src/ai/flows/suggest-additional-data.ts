'use server';

/**
 * @fileOverview AI flow that suggests additional data points to improve analytics accuracy.
 *
 * - suggestAdditionalData -  Suggests additional data points to improve analytics accuracy.
 * - SuggestAdditionalDataInput - The input type for suggestAdditionalData function.
 * - SuggestAdditionalDataOutput - The return type for suggestAdditionalData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAdditionalDataInputSchema = z.object({
  currentAnalysis: z
    .string()
    .describe('The current data analysis performed on quality metrics.'),
  metricsUsed: z
    .string()
    .describe('A list of metrics that were used in the analysis.'),
});
export type SuggestAdditionalDataInput = z.infer<typeof SuggestAdditionalDataInputSchema>;

const SuggestAdditionalDataOutputSchema = z.object({
  suggestedDataPoints: z
    .string()
    .describe(
      'A list of suggested data points that would improve the analysis, with clear reasoning for each suggestion.'
    ),
  reasoning: z
    .string()
    .describe(
      'Explanation of why these additional data points are important for improving analysis accuracy.'
    ),
});
export type SuggestAdditionalDataOutput = z.infer<typeof SuggestAdditionalDataOutputSchema>;

export async function suggestAdditionalData(
  input: SuggestAdditionalDataInput
): Promise<SuggestAdditionalDataOutput> {
  return suggestAdditionalDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAdditionalDataPrompt',
  input: {schema: SuggestAdditionalDataInputSchema},
  output: {schema: SuggestAdditionalDataOutputSchema},
  prompt: `You are a quality analysis expert. Given the current data analysis and the metrics used, suggest additional data points that could be incorporated to improve the accuracy and completeness of the analysis.

Current Analysis: {{{currentAnalysis}}}
Metrics Used: {{{metricsUsed}}}

Consider other metrics related to: patient satisfaction, process efficiency, cost reduction, and regulatory compliance.
Explain why these data points would be beneficial.
`,
});

const suggestAdditionalDataFlow = ai.defineFlow(
  {
    name: 'suggestAdditionalDataFlow',
    inputSchema: SuggestAdditionalDataInputSchema,
    outputSchema: SuggestAdditionalDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
