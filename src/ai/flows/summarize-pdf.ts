'use server';
/**
 * @fileOverview A flow for summarizing PDF documents.
 *
 * - summarizePdf - A function that takes a PDF data URI and returns a summary.
 * - SummarizePdfInput - The input type for the summarizePdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePdfInputSchema = z.object({
  pdfDataUri: z.string().describe(
    "A PDF file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
  ),
});
export type SummarizePdfInput = z.infer<typeof SummarizePdfInputSchema>;

const pdfSummaryPrompt = ai.definePrompt({
  name: 'pdfSummaryPrompt',
  input: {schema: SummarizePdfInputSchema},
  output: {format: 'text'},
  prompt: `Summarize the following document. Extract the key topics, arguments, and conclusions. The summary should be concise and easy to understand.
  
  {{media url=pdfDataUri}}`,
});

export const summarizePdf = ai.defineFlow(
  {
    name: 'summarizePdfFlow',
    inputSchema: SummarizePdfInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const {output} = await pdfSummaryPrompt(input);
    return output || "Could not summarize the PDF.";
  }
);
