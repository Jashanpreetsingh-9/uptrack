import type { TargetStatus, OverallStatus } from '../types';

const statusColors: Record<TargetStatus, string> = {
  up: 'bg-status-up',
  down: 'bg-status-down',
  degraded: 'bg-status-degraded',
  unknown: 'bg-gray-300',
};

const statusLabels: Record<TargetStatus, string> = {
  up: 'Operational',
  down: 'Down',
  degraded: 'Degraded',
  unknown: 'Unknown',
};

export function StatusDot({ status }: { status: TargetStatus }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${statusColors[status]}`}
      title={statusLabels[status]}
    />
  );
}

const bannerStyles: Record<OverallStatus, string> = {
  operational: 'border-status-up/30 bg-status-up/10 text-green-900',
  degraded: 'border-status-degraded/30 bg-status-degraded/10 text-amber-900',
  outage: 'border-status-down/30 bg-status-down/10 text-red-900',
  unknown: 'border-gray-200 bg-gray-50 text-gray-700',
};

export function StatusBanner({
  overall,
  message,
}: {
  overall: OverallStatus;
  message: string;
}) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${bannerStyles[overall]}`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function formatUptime(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return `${value.toFixed(2)}%`;
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) {
    return '—';
  }
  return `${ms}ms`;
}

export function formatDuration(ms: number | null): string {
  if (ms === null) {
    return 'Ongoing';
  }
  if (ms < 60_000) {
    return `${Math.round(ms / 1000)}s`;
  }
  if (ms < 3_600_000) {
    return `${Math.round(ms / 60_000)}m`;
  }
  return `${(ms / 3_600_000).toFixed(1)}h`;
}
