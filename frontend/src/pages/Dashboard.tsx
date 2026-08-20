import { useCallback, useEffect, useState } from 'react';
import { getTarget, getTargetHistory, getTargetIncidents, getTargets, getStatus } from '../api';
import { AddTargetForm } from '../components/AddTargetForm';
import { BackButton } from '../components/BackButton';
import { TimeSeriesChart } from '../components/Charts';
import { formatDuration, StatusBanner } from '../components/StatusBadge';
import { TargetCard } from '../components/TargetCard';
import { usePolling } from '../hooks/usePolling';
import type { CheckPoint, HistoryWindow, Target } from '../types';

export function DashboardPage() {
  const { data: status, loading: statusLoading, error: statusError, refresh: refreshStatus } =
    usePolling(getStatus);
  const { data: targets, loading: targetsLoading, error: targetsError, refresh: refreshTargets } =
    usePolling(getTargets);
  const [sparklines, setSparklines] = useState<Record<string, CheckPoint[]>>({});

  const handleTargetCreated = useCallback(() => {
    refreshTargets();
    refreshStatus();
  }, [refreshTargets, refreshStatus]);

  const loadSparklines = useCallback(async (targetList: Target[]) => {
    const entries = await Promise.all(
      targetList.map(async (target) => {
        try {
          const history = await getTargetHistory(target.id, '24h');
          return [target.id, history.checks.slice(-20)] as const;
        } catch {
          return [target.id, []] as const;
        }
      }),
    );
    setSparklines(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    if (targets && targets.length > 0) {
      void loadSparklines(targets);
    }
  }, [targets, loadSparklines]);

  const loading = statusLoading || targetsLoading;
  const error = statusError ?? targetsError;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">UpTrack</h1>
        <p className="mt-1 text-sm text-gray-500">Uptime monitoring dashboard</p>
      </header>

      {loading && <p className="text-sm text-gray-500">Loading status...</p>}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {status && (
        <div className="mb-8">
          <StatusBanner overall={status.overall} message={status.message} />
        </div>
      )}

      <div className="mb-8">
        <AddTargetForm onCreated={handleTargetCreated} />
      </div>

      {targets && targets.length === 0 && (
        <p className="text-sm text-gray-500">No targets configured yet.</p>
      )}

      {targets && targets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {targets.map((target) => (
            <TargetCard
              key={target.id}
              target={target}
              sparklineChecks={sparklines[target.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TargetDetailPage({ targetId }: { targetId: string }) {
  const [window, setWindow] = useState<HistoryWindow>('24h');
  const [target, setTarget] = useState<Target | null>(null);
  const [history, setHistory] = useState<CheckPoint[]>([]);
  const [uptime, setUptime] = useState<number | null>(null);
  const [incidents, setIncidents] = useState<
    Awaited<ReturnType<typeof getTargetIncidents>>['incidents']
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [targetData, historyData, incidentsData] = await Promise.all([
          getTarget(targetId),
          getTargetHistory(targetId, window),
          getTargetIncidents(targetId),
        ]);

        if (!cancelled) {
          setTarget(targetData);
          setHistory(historyData.checks);
          setUptime(historyData.uptimePercent);
          setIncidents(incidentsData.incidents);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load target');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    void load();

    const timer = setInterval(() => {
      void load();
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [targetId, window]);

  if (loading && !target) {
    return <p className="px-4 py-8 text-sm text-gray-500">Loading target...</p>;
  }

  if (error || !target) {
    return (
      <p className="mx-4 my-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error ?? 'Target not found'}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <BackButton />

      <header className="mt-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{target.name}</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
              target.currentStatus === 'up'
                ? 'bg-green-100 text-green-800'
                : target.currentStatus === 'down'
                  ? 'bg-red-100 text-red-800'
                  : target.currentStatus === 'degraded'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-700'
            }`}
          >
            {target.currentStatus}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">{target.url}</p>
      </header>

      <div className="mb-6 flex gap-2">
        {(['24h', '7d', '30d'] as const).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWindow(w)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              window === w
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-500">Uptime ({window})</p>
        <p className="mt-1 font-mono text-3xl font-semibold text-gray-900">
          {uptime !== null ? `${uptime.toFixed(2)}%` : '—'}
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <TimeSeriesChart checks={history} dataKey="up" label="Availability" color="#22c55e" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <TimeSeriesChart
            checks={history}
            dataKey="latencyMs"
            label="Response time (ms)"
          />
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Incident history
        </h2>
        {incidents.length === 0 ? (
          <p className="text-sm text-gray-500">No incidents recorded.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {incidents.map((incident) => (
              <li key={incident.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(incident.startedAt).toLocaleString()}
                    </p>
                    {incident.cause && (
                      <p className="mt-0.5 text-sm text-gray-500">{incident.cause}</p>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-xs text-gray-500">
                    {formatDuration(incident.durationMs)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
