import { Router, Request, Response } from 'express';
import { redis } from '../utils/redis.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

const router = Router();

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0',
  });
});

// Detailed health check with dependencies
router.get('/detailed', async (req: Request, res: Response) => {
  const checks: Record<string, { status: string; message?: string; latency?: number }> = {
    server: { status: 'ok' },
  };

  // Check Redis
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    checks.redis = {
      status: 'ok',
      latency: `${latency}ms`,
    };
  } catch (error: any) {
    checks.redis = {
      status: 'error',
      message: error.message,
    };
  }

  // Check file system (data directory)
  try {
    const fs = await import('fs/promises');
    await fs.access('./data', fs.constants.F_OK);
    checks.filesystem = { status: 'ok' };
  } catch (error: any) {
    checks.filesystem = {
      status: 'error',
      message: 'Data directory not accessible',
    };
  }

  const allHealthy = Object.values(checks).every(check => check.status === 'ok');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    checks,
  });
});

// Readiness probe (for Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check critical dependencies
    await redis.ping();
    res.json({ status: 'ready' });
  } catch (error) {
    logger.warn({ error }, 'Readiness check failed');
    res.status(503).json({ status: 'not ready' });
  }
});

// Liveness probe (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

export default router;
