import { Line, LineChart, ResponsiveContainer } from 'recharts';
import type { CheckPoint } from '../types';

interface LatencySparklineProps {
  checks: CheckPoint[];
}

export function LatencySparkline({ checks }: LatencySparklineProps) {
  if (checks.length === 0) {
    return <div className="h-10 text-xs text-gray-400">No data yet</div>;
  }

  const data = checks.slice(-20).map((c) => ({
    latency: c.latencyMs,
    up: c.isUp ? 1 : 0,
  }));

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="latency"
            stroke="#6366f1"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TimeSeriesChartProps {
  checks: CheckPoint[];
  dataKey: 'latencyMs' | 'up';
  label: string;
  color?: string;
}

export function TimeSeriesChart({
  checks,
  dataKey,
  label,
  color = '#6366f1',
}: TimeSeriesChartProps) {
  const data = checks.map((c) => ({
    time: new Date(c.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: dataKey === 'up' ? (c.isUp ? 100 : 0) : c.latencyMs,
    fullTime: c.checkedAt,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-gray-400">
        No check data for this window
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="stepAfter"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
