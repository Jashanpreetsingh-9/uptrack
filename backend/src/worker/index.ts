import 'dotenv/config';
import pino from 'pino';
import { performCheck } from '../lib/checker';
import { recordCheckAndUpdateState } from '../lib/check-service';
import { loadEnv } from '../lib/env';
import { prisma } from '../lib/prisma';

const env = loadEnv();
const logger = pino({ name: 'worker' });

interface ScheduledTarget {
  id: string;
  name: string;
  url: string;
  checkIntervalSeconds: number;
}

const timers = new Map<string, NodeJS.Timeout>();
const scheduledConfigs = new Map<string, number>();
const runningChecks = new Set<string>();

async function runCheck(target: ScheduledTarget): Promise<void> {
  if (runningChecks.has(target.id)) {
    logger.warn({ targetId: target.id }, 'Skipping overlapping check');
    return;
  }

  runningChecks.add(target.id);

  try {
    const result = await performCheck(target.url, env.checkTimeoutMs);
    const { incidentOpened, incidentResolved } = await recordCheckAndUpdateState(
      target.id,
      result,
      env.incidentFailureThreshold,
    );

    logger.info(
      {
        targetId: target.id,
        name: target.name,
        url: target.url,
        latencyMs: result.latencyMs,
        statusCode: result.statusCode,
        isUp: result.isUp,
        error: result.error,
        incidentOpened,
        incidentResolved,
      },
      result.isUp ? 'Check passed' : 'Check failed',
    );
  } catch (err) {
    logger.error(
      {
        targetId: target.id,
        name: target.name,
        url: target.url,
        err: err instanceof Error ? err.message : String(err),
      },
      'Check crashed unexpectedly',
    );
  } finally {
    runningChecks.delete(target.id);
  }
}

function scheduleTarget(target: ScheduledTarget): void {
  const existing = timers.get(target.id);
  if (existing) {
    clearInterval(existing);
  }

  const intervalMs = target.checkIntervalSeconds * 1000;
  logger.info(
    { targetId: target.id, name: target.name, intervalSeconds: target.checkIntervalSeconds },
    'Scheduling target',
  );

  void runCheck(target);

  const timer = setInterval(() => {
    void runCheck(target);
  }, intervalMs);

  timers.set(target.id, timer);
}

function unscheduleTarget(targetId: string): void {
  const timer = timers.get(targetId);
  if (timer) {
    clearInterval(timer);
    timers.delete(targetId);
    logger.info({ targetId }, 'Unscheduled target');
  }
}

async function syncTargets(): Promise<void> {
  const targets = await prisma.target.findMany();
  const activeIds = new Set(targets.map((t) => t.id));

  for (const target of targets) {
    const currentInterval = scheduledConfigs.get(target.id);
    if (currentInterval === undefined) {
      scheduleTarget(target);
      scheduledConfigs.set(target.id, target.checkIntervalSeconds);
    } else if (currentInterval !== target.checkIntervalSeconds) {
      scheduleTarget(target);
      scheduledConfigs.set(target.id, target.checkIntervalSeconds);
    }
  }

  for (const scheduledId of timers.keys()) {
    if (!activeIds.has(scheduledId)) {
      unscheduleTarget(scheduledId);
      scheduledConfigs.delete(scheduledId);
    }
  }
}

async function main(): Promise<void> {
  logger.info(
    {
      failureThreshold: env.incidentFailureThreshold,
      checkTimeoutMs: env.checkTimeoutMs,
    },
    'Worker starting',
  );

  await syncTargets();
  setInterval(() => {
    void syncTargets().catch((err) => {
      logger.error({ err: err instanceof Error ? err.message : String(err) }, 'Target sync failed');
    });
  }, 60_000);
}

main().catch((err) => {
  logger.fatal({ err: err instanceof Error ? err.message : String(err) }, 'Worker failed to start');
  process.exit(1);
});
