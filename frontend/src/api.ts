const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
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
