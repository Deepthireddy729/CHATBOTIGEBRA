'use server';

/**
 * @fileOverview implements a Genkit flow for context-aware AI responses, using chat history for more relevant and coherent replies.
 *
 * - contextAwareResponse - A function that generates AI responses considering chat history.
 * - ContextAwareResponseInput - The input type for the contextAwareResponse function.
 * - ContextAwareResponseOutput - The return type for the contextAwareResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextAwareResponseInputSchema = z.object({
  message: z.string().describe('The user message to respond to.'),
  chatHistory: z.array(z.object({user: z.string(), ai: z.string()})).optional().describe('The chat history.'),
  file: z.object({
    data: z.string().describe("A file attached by the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
    name: z.string().describe('The name of the file.'),
  }).optional().describe('A file attached by the user.'),
  fileSummary: z.string().optional().describe('A pre-processed summary of the attached file.'),
});
export type ContextAwareResponseInput = z.infer<typeof ContextAwareResponseInputSchema>;

const ContextAwareResponseOutputSchema = z.object({
  response: z.string().describe('The AI response to the message.'),
});
export type ContextAwareResponseOutput = z.infer<typeof ContextAwareResponseOutputSchema>;

const contextAwareResponsePrompt = ai.definePrompt({
  name: 'contextAwareResponsePrompt',
  input: {schema: z.object({
    message: ContextAwareResponseInputSchema.shape.message,
    chatHistory: ContextAwareResponseInputSchema.shape.chatHistory,
    fileSummary: ContextAwareResponseInputSchema.shape.fileSummary,
  })},
  output: {schema: ContextAwareResponseOutputSchema},
  system: `You are a helpful AI assistant. Consider the chat history and any attached files to provide relevant and coherent responses. If a file is attached, analyze its content thoroughly, paying close attention to its original language.`,
  prompt: `{{#if chatHistory}}
You have a chat history with the user.
{{/if}}

{{#if fileSummary}}
The user has attached a file, and here is a summary of its content:
{{{fileSummary}}}
{{/if}}

User: {{{message}}}
AI:`,
});

const contextAwareResponseFlow = ai.defineFlow(
  {
    name: 'contextAwareResponseFlow',
    inputSchema: ContextAwareResponseInputSchema,
    outputSchema: ContextAwareResponseOutputSchema,
  },
  async input => {
    let summary = input.fileSummary;
    if (input.file && !summary) {
        summary = `The user attached a file named ${input.file.name}.`;
    }

    const {output} = await contextAwareResponsePrompt({
      message: input.message,
      chatHistory: input.chatHistory,
      fileSummary: summary,
    });
    return output!;
  }
);

export async function contextAwareResponse(input: ContextAwareResponseInput): Promise<ContextAwareResponseOutput> {
  return contextAwareResponseFlow(input);
}
