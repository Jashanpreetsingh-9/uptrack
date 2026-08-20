export interface CheckRecord {
  isUp: boolean;
}

/**
 * Count consecutive failed checks from most recent backward.
 * Stops at the first successful check.
 */
export function countConsecutiveFailures(checks: CheckRecord[]): number {
  let count = 0;
  for (const check of checks) {
    if (check.isUp) {
      break;
    }
    count++;
  }
  return count;
}

/**
 * Returns true when a new incident should be opened.
 * Requires threshold consecutive failures and no existing open incident.
 */
export function shouldOpenIncident(
  consecutiveFailures: number,
  threshold: number,
  hasOpenIncident: boolean,
): boolean {
  return !hasOpenIncident && consecutiveFailures >= threshold;
}

/**
 * Returns true when an open incident should be resolved on a successful check.
 */
export function shouldResolveIncident(isUp: boolean, hasOpenIncident: boolean): boolean {
  return isUp && hasOpenIncident;
}
