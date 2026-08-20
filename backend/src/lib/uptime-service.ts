import { prisma } from './prisma';
import {
  computeWindowUptime,
  getRollupQueryEnd,
  getWindowStart,
  type HistoryWindow,
} from './uptime';

export async function getUptimeForWindow(
  targetId: string,
  window: HistoryWindow,
): Promise<number | null> {
  const now = new Date();
  const windowStart = getWindowStart(window, now);
  const rollupEnd = getRollupQueryEnd(now);

  const rollups =
    rollupEnd > windowStart
      ? await prisma.uptimeRollup.findMany({
          where: {
            targetId,
            periodStart: { gte: windowStart, lt: rollupEnd },
          },
          select: { totalChecks: true, upChecks: true },
        })
      : [];

  const recentChecks =
    rollupEnd <= now
      ? await prisma.check.findMany({
          where: {
            targetId,
            checkedAt: { gte: rollupEnd > windowStart ? rollupEnd : windowStart },
          },
          select: { isUp: true },
        })
      : [];

  return computeWindowUptime(rollups, recentChecks);
}

export async function getLatestCheck(targetId: string) {
  return prisma.check.findFirst({
    where: { targetId },
    orderBy: { checkedAt: 'desc' },
  });
}

export async function getCheckHistory(
  targetId: string,
  window: HistoryWindow,
) {
  const windowStart = getWindowStart(window);

  return prisma.check.findMany({
    where: {
      targetId,
      checkedAt: { gte: windowStart },
    },
    orderBy: { checkedAt: 'asc' },
    select: {
      id: true,
      checkedAt: true,
      statusCode: true,
      latencyMs: true,
      isUp: true,
    },
  });
}
