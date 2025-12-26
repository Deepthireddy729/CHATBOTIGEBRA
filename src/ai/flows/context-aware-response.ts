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
});
export type ContextAwareResponseInput = z.infer<typeof ContextAwareResponseInputSchema>;

const ContextAwareResponseOutputSchema = z.object({
  response: z.string().describe('The AI response to the message.'),
});
export type ContextAwareResponseOutput = z.infer<typeof ContextAwareResponseOutputSchema>;

const summarizeChatHistoryTool = ai.defineTool({
  name: 'summarizeChatHistory',
  description: 'Summarizes the chat history to a specified length.  If the chat history is short, return the whole chat history.  If the chat history is very long, summarize it to a length the user specifies.  If the tool is called with length 0, the tool should return an empty string.',
  inputSchema: z.object({
    chatHistory: z.array(z.object({user: z.string(), ai: z.string()})).describe('The chat history to summarize.'),
    length: z.number().describe('The desired length of the summarized chat history in number of turns.  Each turn includes a user and an ai message.'),
  }),
  outputSchema: z.string(),
}, async (input) => {
  if (input.length <= 0) {
    return '';
  }
  if (!input.chatHistory) {
    return '';
  }
  const history = input.chatHistory;
  if (history.length <= input.length) {
    let result = '';
    for (const turn of history) {
      result += `User: ${turn.user}\nAI: ${turn.ai}\n`;
    }
    return result;
  }

  let summarizedHistory = '';
  for (let i = history.length - input.length; i < history.length; i++) {
    const turn = history[i];
    summarizedHistory += `User: ${turn.user}\nAI: ${turn.ai}\n`;
  }
  return summarizedHistory;
});

const contextAwareResponsePrompt = ai.definePrompt({
  name: 'contextAwareResponsePrompt',
  input: {schema: ContextAwareResponseInputSchema},
  output: {schema: ContextAwareResponseOutputSchema},
  tools: [summarizeChatHistoryTool],
  system: `You are a helpful AI assistant. Consider the chat history to provide relevant and coherent responses. Use the summarizeChatHistory tool to shorten the chat history if it is too long. The default length to summarize to is 5 turns.`,
  prompt: `{{#if chatHistory}}The user has a chat history with you. Use the summarizeChatHistory tool if you need to see it.{{/if}}
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

export type {summarizeChatHistoryTool};