import Bull from 'bull';
import { redis } from '../utils/redis.js';
import { logger } from '../utils/logger.js';
import { huggingFaceService } from './huggingface.service.js';
import { memoryStore } from '../db/memory-store.js';
import Papa from 'papaparse';
import fs from 'fs/promises';

// Create job queue (will be null if Redis is not available)
let csvProcessingQueue: Bull.Queue | null = null;

try {
  csvProcessingQueue = new Bull('csv-processing', {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000,
      },
      removeOnFail: {
        age: 24 * 3600, // Keep failed jobs for 24 hours
      },
    },
  });

  csvProcessingQueue.on('error', (error: any) => {
    if (error.code === 'ECONNREFUSED') {
      logger.warn('Redis not available - Bull queue disabled. CSV processing will be synchronous.');
      csvProcessingQueue = null;
    } else {
      logger.warn({ error }, 'Bull queue error');
    }
  });
} catch (error) {
  logger.warn('Bull queue not available - will process CSV files synchronously');
  csvProcessingQueue = null;
}

export { csvProcessingQueue };

// Process CSV upload jobs
csvProcessingQueue.process('process-maternal-csv', async (job) => {
  const { filePath, userId } = job.data;
  logger.info({ jobId: job.id, filePath }, 'Processing maternal CSV file');

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const parseResult = await new Promise<any>((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase().replace(/ /g, '_'),
        complete: resolve,
        error: reject,
      });
    });

    const data = parseResult.data;
    const errors: string[] = [];
    let successCount = 0;

    for (const row of data) {
      try {
        if (!row.patient_id || !row.name || !row.age || !row.risk_factors) {
          errors.push(`Missing required fields for patient ${row.patient_id || 'unknown'}`);
          continue;
        }

        const riskFactors = row.risk_factors.split(',').map((f: string) => f.trim());
        let riskScore = parseInt(row.risk_score) || 0;
        let riskLevel = row.risk_level?.toLowerCase() || 'medium';

        if (!row.risk_score || !row.risk_level) {
          const prediction = await huggingFaceService.predictMaternalRisk({
            age: parseInt(row.age),
            riskFactors,
          });
          riskScore = prediction.riskScore;
          riskLevel = prediction.riskLevel;
        }

        await memoryStore.createOrUpdateMaternalPatient({
          patientId: row.patient_id,
          name: row.name,
          age: parseInt(row.age),
          riskScore,
          riskLevel,
          riskFactors,
          lastUpdated: new Date(row.last_updated || new Date()),
        });

        successCount++;
        
        // Update job progress
        await job.progress((successCount / data.length) * 100);
      } catch (error: any) {
        errors.push(`Error processing patient ${row.patient_id}: ${error.message}`);
      }
    }

    // Clean up file
    await fs.unlink(filePath).catch(() => {});

    logger.info({ jobId: job.id, successCount, total: data.length }, 'Maternal CSV processing completed');

    return {
      success: true,
      recordsProcessed: data.length,
      recordsSuccess: successCount,
      recordsFailed: data.length - successCount,
      errors: errors.slice(0, 10),
    };
  } catch (error: any) {
    logger.error({ jobId: job.id, error }, 'Error processing maternal CSV');
    await fs.unlink(filePath).catch(() => {});
    throw error;
  }
});

csvProcessingQueue.process('process-pediatric-csv', async (job) => {
  const { filePath, userId } = job.data;
  logger.info({ jobId: job.id, filePath }, 'Processing pediatric CSV file');

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const parseResult = await new Promise<any>((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase().replace(/ /g, '_'),
        complete: resolve,
        error: reject,
      });
    });

    const data = parseResult.data;
    const errors: string[] = [];
    let successCount = 0;

    for (const row of data) {
      try {
        if (!row.child_id || !row.name || !row.risk_factors) {
          errors.push(`Missing required fields for child ${row.child_id || 'unknown'}`);
          continue;
        }

        const riskFactors = row.risk_factors.split(',').map((f: string) => f.trim());
        let riskScore = parseInt(row.risk_score) || 0;
        let riskLevel = row.risk_level?.toLowerCase() || 'medium';

        if (!row.risk_score || !row.risk_level) {
          const prediction = await huggingFaceService.predictPediatricRisk({
            birthWeight: parseFloat(row.birth_weight),
            gestationWeeks: parseInt(row.gestation_weeks),
            riskFactors,
          });
          riskScore = prediction.riskScore;
          riskLevel = prediction.riskLevel;
        }

        await memoryStore.createOrUpdatePediatricPatient({
          childId: row.child_id,
          name: row.name,
          birthWeight: row.birth_weight ? parseFloat(row.birth_weight).toString() : undefined,
          gestationWeeks: row.gestation_weeks ? parseInt(row.gestation_weeks) : undefined,
          riskScore,
          riskLevel,
          riskFactors,
          lastUpdated: new Date(row.last_updated || new Date()),
        });

        successCount++;
        await job.progress((successCount / data.length) * 100);
      } catch (error: any) {
        errors.push(`Error processing child ${row.child_id}: ${error.message}`);
      }
    }

    await fs.unlink(filePath).catch(() => {});

    logger.info({ jobId: job.id, successCount, total: data.length }, 'Pediatric CSV processing completed');

    return {
      success: true,
      recordsProcessed: data.length,
      recordsSuccess: successCount,
      recordsFailed: data.length - successCount,
      errors: errors.slice(0, 10),
    };
  } catch (error: any) {
    logger.error({ jobId: job.id, error }, 'Error processing pediatric CSV');
    await fs.unlink(filePath).catch(() => {});
    throw error;
  }
});

// Job queue event handlers
csvProcessingQueue.on('completed', (job, result) => {
  logger.info({ jobId: job.id }, 'CSV processing job completed');
});

csvProcessingQueue.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error }, 'CSV processing job failed');
});

csvProcessingQueue.on('stalled', (job) => {
  logger.warn({ jobId: job.id }, 'CSV processing job stalled');
});
