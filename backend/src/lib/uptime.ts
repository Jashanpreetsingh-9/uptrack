export type HistoryWindow = '24h' | '7d' | '30d';

export interface RollupBucket {
  totalChecks: number;
  upChecks: number;
}

/**
 * Uptime strategy: hourly rollups maintained by the worker (O(1) per check).
 *
 * Tradeoff: rollups avoid scanning the full checks table for 30-day windows as
 * history grows. A pure indexed COUNT(*) on checks works at small scale but
 * degrades with volume. Rollups add slight write complexity and a hybrid query
 * that merges rollups with recent raw checks since the last complete hour.
 */
export function truncateToHour(date: Date): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

export function computeUptimePercent(totalChecks: number, upChecks: number): number | null {
  if (totalChecks === 0) {
    return null;
  }
  return Math.round((upChecks / totalChecks) * 10_000) / 100;
}

export function mergeRollupTotals(buckets: RollupBucket[]): { totalChecks: number; upChecks: number } {
  return buckets.reduce(
    (acc, bucket) => ({
      totalChecks: acc.totalChecks + bucket.totalChecks,
      upChecks: acc.upChecks + bucket.upChecks,
    }),
    { totalChecks: 0, upChecks: 0 },
  );
}

export function windowToMs(window: HistoryWindow): number {
  switch (window) {
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
  }
}

export function getWindowStart(window: HistoryWindow, now: Date = new Date()): Date {
  return new Date(now.getTime() - windowToMs(window));
}

/**
 * For hybrid queries: rollups cover complete hours; raw checks fill the tail
 * from the start of the current (incomplete) hour onward.
 */
export function getRollupQueryEnd(now: Date = new Date()): Date {
  return truncateToHour(now);
}

export function aggregateChecks(checks: { isUp: boolean }[]): { totalChecks: number; upChecks: number } {
  const upChecks = checks.filter((c) => c.isUp).length;
  return { totalChecks: checks.length, upChecks };
}

export function computeWindowUptime(
  rollups: RollupBucket[],
  recentChecks: { isUp: boolean }[],
): number | null {
  const rollupTotals = mergeRollupTotals(rollups);
  const checkTotals = aggregateChecks(recentChecks);

  const totalChecks = rollupTotals.totalChecks + checkTotals.totalChecks;
  const upChecks = rollupTotals.upChecks + checkTotals.upChecks;

  return computeUptimePercent(totalChecks, upChecks);
}

export type TargetStatus = 'up' | 'down' | 'degraded' | 'unknown';

const DEGRADED_LATENCY_MS = 2000;

export function deriveTargetStatus(
  isUp: boolean | null | undefined,
  latencyMs: number | null | undefined,
): TargetStatus {
  if (isUp === null || isUp === undefined) {
    return 'unknown';
  }
  if (!isUp) {
    return 'down';
  }
  if (latencyMs !== null && latencyMs !== undefined && latencyMs >= DEGRADED_LATENCY_MS) {
    return 'degraded';
  }
  return 'up';
}
