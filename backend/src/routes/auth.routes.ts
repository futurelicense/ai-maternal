import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { validate } from '../middleware/validation.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Register new user
router.post('/register', authLimiter, validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    logger.info({ email: req.body.email }, 'User registered');
    res.status(201).json(result);
  } catch (error: any) {
    logger.warn({ error: error.message, email: req.body.email }, 'Registration failed');
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    logger.info({ email }, 'User logged in');
    res.json(result);
  } catch (error: any) {
    logger.warn({ error: error.message, email: req.body.email }, 'Login failed');
    res.status(401).json({ error: error.message });
  }
});

// Verify token
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const user = authService.verifyToken(token);
    res.json({ valid: true, user });
  } catch (error: any) {
    res.status(401).json({ valid: false, error: error.message });
  }
});

export default router;

