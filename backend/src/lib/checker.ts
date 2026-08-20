export interface CheckResult {
  statusCode: number | null;
  latencyMs: number;
  isUp: boolean;
  error: string | null;
}

export function isUpStatusCode(statusCode: number | null): boolean {
  return statusCode !== null && statusCode >= 200 && statusCode < 300;
}

export function formatFailureCause(result: CheckResult): string {
  if (result.error) {
    return result.error;
  }
  if (result.statusCode !== null) {
    return `HTTP ${result.statusCode}`;
  }
  return 'Unknown failure';
}

export async function performCheck(url: string, timeoutMs: number): Promise<CheckResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'uptrack-monitor/1.0',
      },
    });

    const latencyMs = Date.now() - start;
    const statusCode = response.status;

    return {
      statusCode,
      latencyMs,
      isUp: isUpStatusCode(statusCode),
      error: null,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Request failed';

    return {
      statusCode: null,
      latencyMs,
      isUp: false,
      error: message.includes('abort') ? 'Request timed out' : message,
    };
  } finally {
    clearTimeout(timer);
  }
}
