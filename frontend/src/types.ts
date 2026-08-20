export type TargetStatus = 'up' | 'down' | 'degraded' | 'unknown';
export type OverallStatus = 'operational' | 'degraded' | 'outage' | 'unknown';
export type HistoryWindow = '24h' | '7d' | '30d';

export interface LatestCheck {
  checkedAt: string;
  statusCode: number | null;
  latencyMs: number;
  isUp: boolean;
}

export interface Target {
  id: string;
  name: string;
  url: string;
  checkIntervalSeconds: number;
  createdAt: string;
  currentStatus: TargetStatus;
  latestCheck: LatestCheck | null;
  uptime24h: number | null;
}

export interface StatusSummary {
  overall: OverallStatus;
  message: string;
  counts: {
    up: number;
    down: number;
    degraded: number;
    unknown: number;
    total: number;
  };
}

export interface CheckPoint {
  id: string;
  checkedAt: string;
  statusCode: number | null;
  latencyMs: number;
  isUp: boolean;
}

export interface HistoryResponse {
  window: HistoryWindow;
  uptimePercent: number | null;
  checks: CheckPoint[];
}

export interface Incident {
  id: string;
  startedAt: string;
  resolvedAt: string | null;
  cause: string | null;
  durationMs: number | null;
}

export interface IncidentsResponse {
  incidents: Incident[];
  total: number;
  limit: number;
  offset: number;
}
