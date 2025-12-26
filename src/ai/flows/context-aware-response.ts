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
});
export type ContextAwareResponseInput = z.infer<typeof ContextAwareResponseInputSchema>;

const ContextAwareResponseOutputSchema = z.object({
  response: z.string().describe('The AI response to the message.'),
});
export type ContextAwareResponseOutput = z.infer<typeof ContextAwareResponseOutputSchema>;

const contextAwareResponsePrompt = ai.definePrompt({
  name: 'contextAwareResponsePrompt',
  input: {schema: ContextAwareResponseInputSchema},
  output: {schema: ContextAwareResponseOutputSchema},
  system: `You are a helpful AI assistant. Consider the chat history and any attached files to provide relevant and coherent responses.`,
  prompt: `{{#if chatHistory}}
You have a chat history with the user.
{{/if}}

{{#if file}}
The user has attached a file named '{{file.name}}'.
Here is the file content:
{{media url=file.data}}
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
    const {output} = await contextAwareResponsePrompt(input);
    return output!;
  }
);

export async function contextAwareResponse(input: ContextAwareResponseInput): Promise<ContextAwareResponseOutput> {
  return contextAwareResponseFlow(input);
}
