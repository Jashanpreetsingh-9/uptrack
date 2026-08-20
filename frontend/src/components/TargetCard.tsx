import { Link } from 'react-router-dom';
import { LatencySparkline } from './Charts';
import { formatLatency, formatUptime, StatusDot } from './StatusBadge';
import type { Target } from '../types';
import type { CheckPoint } from '../types';

interface TargetCardProps {
  target: Target;
  sparklineChecks?: CheckPoint[];
}

export function TargetCard({ target, sparklineChecks = [] }: TargetCardProps) {
  return (
    <Link
      to={`/targets/${target.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">{target.name}</h2>
          <p className="mt-0.5 truncate text-xs text-gray-500">{target.url}</p>
        </div>
        <StatusDot status={target.currentStatus} />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">24h uptime</p>
          <p className="font-mono font-medium text-gray-900">{formatUptime(target.uptime24h)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Latency</p>
          <p className="font-mono font-medium text-gray-900">
            {formatLatency(target.latestCheck?.latencyMs)}
          </p>
        </div>
      </div>

      <LatencySparkline checks={sparklineChecks} />
    </Link>
  );
}
