import { describe, expect, it } from 'vitest';
import {
  countConsecutiveFailures,
  shouldOpenIncident,
  shouldResolveIncident,
} from '../incidents';

describe('countConsecutiveFailures', () => {
  it('returns 0 when most recent check is up', () => {
    expect(countConsecutiveFailures([{ isUp: true }, { isUp: false }])).toBe(0);
  });

  it('counts consecutive failures from most recent', () => {
    expect(
      countConsecutiveFailures([
        { isUp: false },
        { isUp: false },
        { isUp: true },
        { isUp: false },
      ]),
    ).toBe(2);
  });

  it('returns full count when all recent checks failed', () => {
    expect(
      countConsecutiveFailures([{ isUp: false }, { isUp: false }, { isUp: false }]),
    ).toBe(3);
  });
});

describe('shouldOpenIncident', () => {
  const threshold = 3;

  it('does not open with fewer than threshold failures', () => {
    expect(shouldOpenIncident(2, threshold, false)).toBe(false);
  });

  it('opens at threshold consecutive failures', () => {
    expect(shouldOpenIncident(3, threshold, false)).toBe(true);
  });

  it('does not open duplicate when incident already open', () => {
    expect(shouldOpenIncident(3, threshold, true)).toBe(false);
  });
});

describe('shouldResolveIncident', () => {
  it('resolves on first success with open incident', () => {
    expect(shouldResolveIncident(true, true)).toBe(true);
  });

  it('does not resolve when check failed', () => {
    expect(shouldResolveIncident(false, true)).toBe(false);
  });

  it('does not resolve when no open incident', () => {
    expect(shouldResolveIncident(true, false)).toBe(false);
  });
});

describe('incident threshold scenario', () => {
  const threshold = 3;

  it('2 failures do not open, 3rd opens, success resolves', () => {
    const checks: { isUp: boolean }[] = [];

    for (let i = 0; i < 2; i++) {
      checks.unshift({ isUp: false });
      expect(countConsecutiveFailures(checks)).toBe(i + 1);
      expect(shouldOpenIncident(countConsecutiveFailures(checks), threshold, false)).toBe(false);
    }

    checks.unshift({ isUp: false });
    expect(shouldOpenIncident(countConsecutiveFailures(checks), threshold, false)).toBe(true);

    expect(shouldResolveIncident(true, true)).toBe(true);
  });
});
