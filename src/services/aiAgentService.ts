import { httpClient } from '../lib/httpClient';

export interface AskResponse {
  answer: string;
}

export const AI_AGENT_TIMEOUT_MS = 60_000;

export const aiAgentService = {
  ask: (question: string) =>
    httpClient
      .post<AskResponse>('/ask', { question }, { timeout: AI_AGENT_TIMEOUT_MS })
      .then((response) => response.data),
};
