import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { authService } from './services/auth.service.js';
import { logger } from './utils/logger.js';
import { initSentry } from './utils/sentry.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { redis } from './utils/redis.js';

// Initialize Sentry
initSentry();

// Import routes
import authRoutes from './routes/auth.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import digitalTwinsRoutes from './routes/digitalTwins.routes.js';
import policyRoutes from './routes/policy.routes.js';
import resourcesRoutes from './routes/resources.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

// Sentry request handler (must be first)
if (env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging with Pino
app.use(pinoHttp({ logger }));

// Rate limiting
app.use('/api', apiLimiter);

// Health check (before auth)
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/digital-twins', digitalTwinsRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/resources', resourcesRoutes);

// Sentry error handler (must be before other error handlers)
if (env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  app.use(Sentry.Handlers.errorHandler());
}

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn({ path: req.path, method: req.method }, 'Route not found');
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ 
    error: err.message, 
    stack: err.stack, 
    path: req.path,
    method: req.method,
  }, 'Unhandled error');
  
  res.status(500).json({
    error: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
const PORT = parseInt(env.PORT);

app.listen(PORT, async () => {
  logger.info({
    port: PORT,
    environment: env.NODE_ENV,
    corsOrigin: env.CORS_ORIGIN,
    redisHost: env.REDIS_HOST,
    redisPort: env.REDIS_PORT,
    sentryEnabled: !!env.SENTRY_DSN,
  }, '🏥 Maternal & Child Health Tracker API starting');

  // Test Redis connection
  try {
    await redis.ping();
    logger.info('✅ Redis connected');
  } catch (error) {
    logger.warn({ error }, '⚠️  Redis connection failed - caching disabled');
  }

  // Create default user
  try {
    await authService.createDefaultUser();
    logger.info('✅ Default user created');
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error creating default user');
  }

  logger.info({
    port: PORT,
    apiUrl: `http://localhost:${PORT}`,
    healthCheck: `http://localhost:${PORT}/health`,
  }, '✅ Server ready to accept requests');
});

export default app;

