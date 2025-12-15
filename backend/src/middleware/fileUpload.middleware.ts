import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
      cb(null, env.UPLOAD_DIR);
    } catch (error) {
      cb(error as Error, env.UPLOAD_DIR);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for CSV only
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  const allowedMimes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/csv',
    'text/plain',
  ];
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.csv'];
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    logger.warn({
      filename: file.originalname,
      mimetype: file.mimetype,
      ip: req.ip,
    }, 'Invalid file type attempted');
    
    cb(new Error('Only CSV files are allowed'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(env.MAX_FILE_SIZE),
    files: 1,
  },
});

// Middleware to validate uploaded file
export const validateUploadedFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Additional validation: check file content
  try {
    const fileContent = await fs.readFile(req.file.path, 'utf-8');
    
    // Basic CSV validation - check if it has at least a header row
    const lines = fileContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ 
        error: 'CSV file must contain at least a header row and one data row' 
      });
    }

    // Check for common CSV delimiters
    const hasComma = lines[0].includes(',');
    const hasSemicolon = lines[0].includes(';');
    
    if (!hasComma && !hasSemicolon) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ 
        error: 'File does not appear to be a valid CSV file' 
      });
    }

    next();
  } catch (error: any) {
    logger.error({ error, file: req.file.path }, 'Error validating uploaded file');
    
    // Clean up file
    await fs.unlink(req.file.path).catch(() => {});
    
    return res.status(500).json({ 
      error: 'Error processing uploaded file',
      details: env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
