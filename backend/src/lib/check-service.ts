import { prisma } from './prisma';
import { formatFailureCause, type CheckResult } from './checker';
import {
  countConsecutiveFailures,
  shouldOpenIncident,
  shouldResolveIncident,
} from './incidents';
import { truncateToHour } from './uptime';

export async function recordCheckAndUpdateState(
  targetId: string,
  result: CheckResult,
  failureThreshold: number,
): Promise<{ incidentOpened: boolean; incidentResolved: boolean }> {
  const checkedAt = new Date();

  await prisma.check.create({
    data: {
      targetId,
      checkedAt,
      statusCode: result.statusCode,
      latencyMs: result.latencyMs,
      isUp: result.isUp,
    },
  });

  await upsertHourlyRollup(targetId, checkedAt, result.isUp);

  const openIncident = await prisma.incident.findFirst({
    where: { targetId, resolvedAt: null },
    orderBy: { startedAt: 'desc' },
  });

  let incidentOpened = false;
  let incidentResolved = false;

  if (shouldResolveIncident(result.isUp, openIncident !== null)) {
    await prisma.incident.update({
      where: { id: openIncident!.id },
      data: { resolvedAt: checkedAt },
    });
    incidentResolved = true;
  } else if (!result.isUp) {
    const recentChecks = await prisma.check.findMany({
      where: { targetId },
      orderBy: { checkedAt: 'desc' },
      take: failureThreshold,
      select: { isUp: true },
    });

    const consecutiveFailures = countConsecutiveFailures(recentChecks);

    if (shouldOpenIncident(consecutiveFailures, failureThreshold, openIncident !== null)) {
      await prisma.incident.create({
        data: {
          targetId,
          startedAt: checkedAt,
          cause: formatFailureCause(result),
        },
      });
      incidentOpened = true;
    }
  }

  return { incidentOpened, incidentResolved };
}

async function upsertHourlyRollup(
  targetId: string,
  checkedAt: Date,
  isUp: boolean,
): Promise<void> {
  const periodStart = truncateToHour(checkedAt);

  await prisma.uptimeRollup.upsert({
    where: {
      targetId_periodStart: { targetId, periodStart },
    },
    create: {
      targetId,
      periodStart,
      totalChecks: 1,
      upChecks: isUp ? 1 : 0,
    },
    update: {
      totalChecks: { increment: 1 },
      upChecks: isUp ? { increment: 1 } : undefined,
    },
  });
}
