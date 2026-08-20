const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) {
      return body.error;
    }
  } catch {
    // ignore JSON parse failures
  }
  return `API error: ${response.status}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json() as Promise<T>;
}

export function getStatus() {
  return fetchJson<import('./types').StatusSummary>('/status');
}

export function getTargets() {
  return fetchJson<import('./types').Target[]>('/targets');
}

export function getTarget(id: string) {
  return fetchJson<import('./types').Target>(`/targets/${id}`);
}

export function getTargetHistory(id: string, window: import('./types').HistoryWindow) {
  return fetchJson<import('./types').HistoryResponse>(`/targets/${id}/history?window=${window}`);
}

export function getTargetIncidents(id: string) {
  return fetchJson<import('./types').IncidentsResponse>(`/targets/${id}/incidents`);
}

export interface CreateTargetInput {
  name: string;
  url: string;
  checkIntervalSeconds?: number;
}

export function createTarget(input: CreateTargetInput, apiKey: string) {
  return fetchJson<import('./types').Target>('/targets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Not X-API-Key: API Gateway treats that as its own usage-plan key.
      'X-Uptrack-Key': apiKey,
    },
    body: JSON.stringify(input),
  });
}
