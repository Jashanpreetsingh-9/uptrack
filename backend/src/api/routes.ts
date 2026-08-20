import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { apiKeyAuth } from './middleware/api-key';
import { getCheckHistory, getLatestCheck, getUptimeForWindow } from '../lib/uptime-service';
import { deriveTargetStatus, type HistoryWindow } from '../lib/uptime';

const DEFAULT_CHECK_INTERVAL = 60;

function parseWindow(value: unknown): HistoryWindow | null {
  if (value === '24h' || value === '7d' || value === '30d') {
    return value;
  }
  return null;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function serializeTarget(target: { id: string; name: string; url: string; checkIntervalSeconds: number; createdAt: Date }) {
  const latestCheck = await getLatestCheck(target.id);
  const uptime24h = await getUptimeForWindow(target.id, '24h');

  return {
    id: target.id,
    name: target.name,
    url: target.url,
    checkIntervalSeconds: target.checkIntervalSeconds,
    createdAt: target.createdAt.toISOString(),
    currentStatus: deriveTargetStatus(latestCheck?.isUp, latestCheck?.latencyMs),
    latestCheck: latestCheck
      ? {
          checkedAt: latestCheck.checkedAt.toISOString(),
          statusCode: latestCheck.statusCode,
          latencyMs: latestCheck.latencyMs,
          isUp: latestCheck.isUp,
        }
      : null,
    uptime24h,
  };
}

export function createRouter(apiKey: string) {
  const router = Router();

  router.get('/status', async (_req, res) => {
    try {
      const targets = await prisma.target.findMany();
      let up = 0;
      let down = 0;
      let degraded = 0;
      let unknown = 0;

      for (const target of targets) {
        const latest = await getLatestCheck(target.id);
        const status = deriveTargetStatus(latest?.isUp, latest?.latencyMs);
        switch (status) {
          case 'up':
            up++;
            break;
          case 'down':
            down++;
            break;
          case 'degraded':
            degraded++;
            break;
          case 'unknown':
            unknown++;
            break;
        }
      }

      let overall: 'operational' | 'degraded' | 'outage' | 'unknown';
      let message: string;

      if (targets.length === 0) {
        overall = 'unknown';
        message = 'No targets configured';
      } else if (down > 0) {
        overall = 'outage';
        message = `${down} system${down === 1 ? '' : 's'} experiencing issues`;
      } else if (degraded > 0) {
        overall = 'degraded';
        message = `${degraded} system${degraded === 1 ? '' : 's'} degraded`;
      } else if (unknown === targets.length) {
        overall = 'unknown';
        message = 'Awaiting first checks';
      } else {
        overall = 'operational';
        message = 'All systems operational';
      }

      res.json({
        overall,
        message,
        counts: { up, down, degraded, unknown, total: targets.length },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/targets', async (_req, res) => {
    try {
      const targets = await prisma.target.findMany({ orderBy: { name: 'asc' } });
      const serialized = await Promise.all(targets.map(serializeTarget));
      res.json(serialized);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/targets/:id', async (req, res) => {
    try {
      const target = await prisma.target.findUnique({ where: { id: req.params.id } });
      if (!target) {
        res.status(404).json({ error: 'Target not found' });
        return;
      }
      res.json(await serializeTarget(target));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/targets/:id/history', async (req, res) => {
    try {
      const window = parseWindow(req.query.window ?? '24h');
      if (!window) {
        res.status(400).json({ error: 'Invalid window. Use 24h, 7d, or 30d.' });
        return;
      }

      const target = await prisma.target.findUnique({ where: { id: req.params.id } });
      if (!target) {
        res.status(404).json({ error: 'Target not found' });
        return;
      }

      const [checks, uptimePercent] = await Promise.all([
        getCheckHistory(target.id, window),
        getUptimeForWindow(target.id, window),
      ]);

      res.json({
        window,
        uptimePercent,
        checks: checks.map((c) => ({
          id: c.id,
          checkedAt: c.checkedAt.toISOString(),
          statusCode: c.statusCode,
          latencyMs: c.latencyMs,
          isUp: c.isUp,
        })),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/targets/:id/incidents', async (req, res) => {
    try {
      const target = await prisma.target.findUnique({ where: { id: req.params.id } });
      if (!target) {
        res.status(404).json({ error: 'Target not found' });
        return;
      }

      const limit = Math.min(Number(req.query.limit ?? 50), 100);
      const offset = Number(req.query.offset ?? 0);

      const [incidents, total] = await Promise.all([
        prisma.incident.findMany({
          where: { targetId: target.id },
          orderBy: { startedAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.incident.count({ where: { targetId: target.id } }),
      ]);

      res.json({
        incidents: incidents.map((i) => ({
          id: i.id,
          startedAt: i.startedAt.toISOString(),
          resolvedAt: i.resolvedAt?.toISOString() ?? null,
          cause: i.cause,
          durationMs: i.resolvedAt
            ? i.resolvedAt.getTime() - i.startedAt.getTime()
            : null,
        })),
        total,
        limit,
        offset,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/targets', apiKeyAuth(apiKey), async (req, res) => {
    try {
      const { name, url, checkIntervalSeconds } = req.body as {
        name?: string;
        url?: string;
        checkIntervalSeconds?: number;
      };

      if (!name?.trim() || !url?.trim()) {
        res.status(400).json({ error: 'name and url are required' });
        return;
      }

      if (!isValidUrl(url.trim())) {
        res.status(400).json({ error: 'url must be a valid http or https URL' });
        return;
      }

      const interval = checkIntervalSeconds ?? DEFAULT_CHECK_INTERVAL;
      if (!Number.isInteger(interval) || interval < 10) {
        res.status(400).json({ error: 'checkIntervalSeconds must be an integer >= 10' });
        return;
      }

      const target = await prisma.target.create({
        data: {
          name: name.trim(),
          url: url.trim(),
          checkIntervalSeconds: interval,
        },
      });

      res.status(201).json(await serializeTarget(target));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
