import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body
      if (schema && req.body) {
        req.body = await schema.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn({ errors, path: req.path }, 'Validation failed');
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }
      
      logger.error({ error, path: req.path }, 'Validation middleware error');
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.warn({ errors, path: req.path }, 'Query validation failed');
        
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: errors,
        });
      }
      
      logger.error({ error, path: req.path }, 'Query validation middleware error');
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};
