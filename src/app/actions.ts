'use server';

import { contextAwareResponse, type ContextAwareResponseInput, type ContextAwareResponseOutput } from '@/ai/flows/context-aware-response';

export async function getAIResponse(input: ContextAwareResponseInput): Promise<ContextAwareResponseOutput> {
  // Ensure chat history is properly formatted if needed, or rely on the flow to handle it.
  return contextAwareResponse(input);
}
