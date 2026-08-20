import { describe, expect, it } from 'vitest';
import {
  aggregateChecks,
  computeUptimePercent,
  computeWindowUptime,
  getRollupQueryEnd,
  getWindowStart,
  mergeRollupTotals,
  truncateToHour,
} from '../uptime';

describe('computeUptimePercent', () => {
  it('returns null for zero checks', () => {
    expect(computeUptimePercent(0, 0)).toBeNull();
  });

  it('computes percentage with two decimal precision', () => {
    expect(computeUptimePercent(3, 2)).toBe(66.67);
    expect(computeUptimePercent(100, 100)).toBe(100);
    expect(computeUptimePercent(100, 0)).toBe(0);
  });
});

describe('mergeRollupTotals', () => {
  it('sums rollup buckets', () => {
    expect(
      mergeRollupTotals([
        { totalChecks: 10, upChecks: 9 },
        { totalChecks: 5, upChecks: 4 },
      ]),
    ).toEqual({ totalChecks: 15, upChecks: 13 });
  });
});

describe('computeWindowUptime', () => {
  it('merges rollups and recent checks', () => {
    const uptime = computeWindowUptime(
      [{ totalChecks: 100, upChecks: 99 }],
      [{ isUp: true }, { isUp: false }],
    );
    expect(uptime).toBe(98.04);
  });

  it('returns null when no data', () => {
    expect(computeWindowUptime([], [])).toBeNull();
  });
});

describe('truncateToHour', () => {
  it('zeroes minutes seconds and ms', () => {
    const input = new Date('2026-03-20T14:37:22.456Z');
    const result = truncateToHour(input);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe('getWindowStart', () => {
  it('returns 24h ago for 24h window', () => {
    const now = new Date('2026-03-20T12:00:00Z');
    const start = getWindowStart('24h', now);
    expect(start.toISOString()).toBe('2026-03-19T12:00:00.000Z');
  });
});

describe('getRollupQueryEnd', () => {
  it('returns start of current hour', () => {
    const now = new Date('2026-03-20T14:37:00Z');
    const end = getRollupQueryEnd(now);
    expect(end.getHours()).toBe(now.getHours());
    expect(end.getMinutes()).toBe(0);
  });
});

describe('aggregateChecks', () => {
  it('counts up checks', () => {
    expect(aggregateChecks([{ isUp: true }, { isUp: false }, { isUp: true }])).toEqual({
      totalChecks: 3,
      upChecks: 2,
    });
  });
});
