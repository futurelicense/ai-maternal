import { Router, Request, Response } from 'express';
import { memoryStore } from '../db/memory-store.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload, validateUploadedFile } from '../middleware/fileUpload.middleware.js';
import { uploadLimiter } from '../middleware/rateLimit.middleware.js';
import { paginationSchema, filterSchema } from '../validators/schemas.js';
import { validateQuery } from '../middleware/validation.middleware.js';
import { z } from 'zod';
import { getPaginationParams, createPagination } from '../utils/pagination.js';
import { cache, cacheKeys } from '../utils/redis.js';
import { csvProcessingQueue } from '../services/jobQueue.js';
import { logger } from '../utils/logger.js';
import { huggingFaceService } from '../services/huggingface.service.js';
import Papa from 'papaparse';
import fs from 'fs/promises';

const router = Router();

// Helper function to auto-generate policy scenarios based on patient data
async function generatePolicyScenarios() {
  const maternal = await memoryStore.getMaternalPatients();
  const pediatric = await memoryStore.getPediatricPatients();
  
  // Only generate if we have patient data but no policy scenarios
  const existingScenarios = await memoryStore.getPolicyScenarios();
  if (existingScenarios.length > 0) {
    return; // Already have scenarios
  }
  
  const totalPatients = maternal.length + pediatric.length;
  if (totalPatients === 0) {
    return; // No patient data to base scenarios on
  }
  
  // Calculate high-risk percentage
  const highRiskPatients = [...maternal, ...pediatric].filter(
    p => p.riskLevel === 'high' || p.riskLevel === 'critical'
  ).length;
  const highRiskPercentage = (highRiskPatients / totalPatients) * 100;
  
  // Generate policy scenarios based on data insights
  const scenarios = [
    {
      scenarioId: 'PS001',
      name: 'Enhanced Prenatal Screening',
      description: 'Implement comprehensive risk screening at every prenatal visit using AI-powered assessment tools',
      maternalMortalityChange: -15,
      infantMortalityChange: -12,
      costIncrease: 8,
      implementationTime: '6-9 months',
    },
    {
      scenarioId: 'PS002',
      name: 'Mobile Health Clinics',
      description: 'Deploy mobile health units to underserved areas for increased access to prenatal and postnatal care',
      maternalMortalityChange: -22,
      infantMortalityChange: -18,
      costIncrease: 15,
      implementationTime: '12-18 months',
    },
    {
      scenarioId: 'PS003',
      name: 'Community Health Worker Program',
      description: 'Train and deploy community health workers for home visits and early intervention',
      maternalMortalityChange: -18,
      infantMortalityChange: -20,
      costIncrease: 12,
      implementationTime: '9-12 months',
    },
  ];
  
  // Adjust impact based on high-risk percentage
  const adjustmentFactor = highRiskPercentage > 40 ? 1.2 : highRiskPercentage > 20 ? 1.0 : 0.8;
  
  for (const scenario of scenarios) {
    await memoryStore.createPolicyScenario({
      ...scenario,
      maternalMortalityChange: Math.round(scenario.maternalMortalityChange * adjustmentFactor),
      infantMortalityChange: Math.round(scenario.infantMortalityChange * adjustmentFactor),
    });
  }
}

// Helper function to auto-generate resource allocations based on patient data
async function generateResourceAllocations() {
  const maternal = await memoryStore.getMaternalPatients();
  const pediatric = await memoryStore.getPediatricPatients();
  
  // Only generate if we have patient data but no resource allocations
  const existingResources = await memoryStore.getResourceAllocations();
  if (existingResources.length > 0) {
    return; // Already have resources
  }
  
  const totalPatients = maternal.length + pediatric.length;
  if (totalPatients === 0) {
    return; // No patient data to base allocations on
  }
  
  // Group patients by region (using first 3 characters of ID as mock region)
  const regionMap = new Map<string, { maternal: number; pediatric: number; highRisk: number }>();
  
  maternal.forEach(p => {
    const region = p.patientId.substring(0, 3).toUpperCase();
    const data = regionMap.get(region) || { maternal: 0, pediatric: 0, highRisk: 0 };
    data.maternal++;
    if (p.riskLevel === 'high' || p.riskLevel === 'critical') {
      data.highRisk++;
    }
    regionMap.set(region, data);
  });
  
  pediatric.forEach(p => {
    const region = p.childId.substring(0, 3).toUpperCase();
    const data = regionMap.get(region) || { maternal: 0, pediatric: 0, highRisk: 0 };
    data.pediatric++;
    if (p.riskLevel === 'high' || p.riskLevel === 'critical') {
      data.highRisk++;
    }
    regionMap.set(region, data);
  });
  
  // If no regions identified, create default regions
  if (regionMap.size === 0) {
    const defaultRegions = [
      { name: 'North District', nicuBeds: 45, obgynStaff: 32, vaccineStock: 78 },
      { name: 'South District', nicuBeds: 38, obgynStaff: 28, vaccineStock: 85 },
      { name: 'East District', nicuBeds: 52, obgynStaff: 38, vaccineStock: 72 },
      { name: 'West District', nicuBeds: 41, obgynStaff: 30, vaccineStock: 80 },
      { name: 'Central District', nicuBeds: 48, obgynStaff: 35, vaccineStock: 88 },
    ];
    
    for (const region of defaultRegions) {
      await memoryStore.createOrUpdateResourceAllocation({
        region: region.name,
        nicuBeds: region.nicuBeds,
        obgynStaff: region.obgynStaff,
        vaccineStock: region.vaccineStock,
        lastUpdated: new Date(),
      });
    }
    return;
  }
  
  // Generate resource allocations based on patient distribution
  for (const [regionCode, data] of regionMap.entries()) {
    const totalInRegion = data.maternal + data.pediatric;
    const riskRatio = data.highRisk / totalInRegion;
    
    // Base allocation on patient count and risk ratio
    const nicuBeds = Math.max(20, Math.round(totalInRegion * 8 * (1 + riskRatio)));
    const obgynStaff = Math.max(15, Math.round(totalInRegion * 6 * (1 + riskRatio)));
    const vaccineStock = Math.max(60, Math.round(75 + (totalInRegion * 2) * (1 + riskRatio * 0.5)));
    
    await memoryStore.createOrUpdateResourceAllocation({
      region: `${regionCode} Region`,
      nicuBeds: Math.min(nicuBeds, 80), // Cap at reasonable maximums
      obgynStaff: Math.min(obgynStaff, 60),
      vaccineStock: Math.min(vaccineStock, 95),
      lastUpdated: new Date(),
    });
  }
}

// Apply authentication to all routes
router.use(authenticate);

const listQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  riskLevel: filterSchema.shape.riskLevel,
  dateFrom: filterSchema.shape.dateFrom,
  dateTo: filterSchema.shape.dateTo,
  search: filterSchema.shape.search,
});

// Get all maternal patients with pagination and filtering
router.get('/maternal', validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const filters = {
      riskLevel: req.query.riskLevel as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      search: req.query.search as string | undefined,
    };

    // Check cache
    const cacheKey = cacheKeys.patients.maternal(page, limit, filters);
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let patients = await memoryStore.getMaternalPatients();

    // Apply filters
    if (filters.riskLevel) {
      patients = patients.filter(p => p.riskLevel === filters.riskLevel);
    }
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      patients = patients.filter(p => new Date(p.lastUpdated) >= dateFrom);
    }
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      patients = patients.filter(p => new Date(p.lastUpdated) <= dateTo);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      patients = patients.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.patientId.toLowerCase().includes(searchLower)
      );
    }

    const total = patients.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedPatients = patients.slice(start, end);

    const response = createPagination(paginatedPatients, page, limit, total);

    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300);

    res.json(response);
  } catch (error: any) {
    logger.error({ error, path: req.path }, 'Error fetching maternal patients');
    res.status(500).json({ error: error.message });
  }
});

// Get all pediatric patients with pagination and filtering
router.get('/pediatric', validateQuery(listQuerySchema), async (req: Request, res: Response) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const filters = {
      riskLevel: req.query.riskLevel as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      search: req.query.search as string | undefined,
    };

    // Check cache
    const cacheKey = cacheKeys.patients.pediatric(page, limit, filters);
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let patients = await memoryStore.getPediatricPatients();

    // Apply filters
    if (filters.riskLevel) {
      patients = patients.filter(p => p.riskLevel === filters.riskLevel);
    }
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      patients = patients.filter(p => new Date(p.lastUpdated) >= dateFrom);
    }
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      patients = patients.filter(p => new Date(p.lastUpdated) <= dateTo);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      patients = patients.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.childId.toLowerCase().includes(searchLower)
      );
    }

    const total = patients.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedPatients = patients.slice(start, end);

    const response = createPagination(paginatedPatients, page, limit, total);

    // Cache for 5 minutes
    await cache.set(cacheKey, response, 300);

    res.json(response);
  } catch (error: any) {
    logger.error({ error, path: req.path }, 'Error fetching pediatric patients');
    res.status(500).json({ error: error.message });
  }
});

// Get maternal patient by ID
router.get('/maternal/:id', async (req: Request, res: Response) => {
  try {
    const patient = await memoryStore.getMaternalPatient(req.params.id);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get pediatric patient by ID
router.get('/pediatric/:id', async (req: Request, res: Response) => {
  try {
    const patient = await memoryStore.getPediatricPatient(req.params.id);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload and process maternal CSV data (background job + validation + rate limiting)
router.post('/maternal/upload', uploadLimiter, upload.single('file'), validateUploadedFile, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Use background job if available, otherwise process synchronously
    if (csvProcessingQueue) {
      const job = await csvProcessingQueue.add('process-maternal-csv', {
        filePath: req.file.path,
        userId: req.user?.id,
      });

      logger.info({ jobId: job.id, filename: req.file.originalname }, 'Maternal CSV upload queued');

      return res.json({
        success: true,
        message: 'File uploaded and queued for processing',
        jobId: job.id,
      });
    }

    // Fallback: synchronous processing
    logger.info({ filename: req.file.originalname }, 'Processing maternal CSV synchronously (Redis not available)');
    const fileContent = await fs.readFile(req.file.path, 'utf-8');
    
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
      } catch (error: any) {
        errors.push(`Error processing patient ${row.patient_id}: ${error.message}`);
      }
    }

    await fs.unlink(req.file.path).catch(() => {});

    // Auto-generate policy scenarios and resource allocations
    try {
      await generatePolicyScenarios();
      await generateResourceAllocations();
    } catch (error: any) {
      logger.warn({ error: error.message }, 'Failed to generate policy/resource data');
    }

    // Invalidate all related caches
    await cache.delPattern('patients:maternal:*');
    await cache.del('dashboard:stats');
    await cache.del('analytics:insights');
    await cache.del('analytics:trends');

    res.json({
      success: true,
      recordsProcessed: data.length,
      recordsSuccess: successCount,
      recordsFailed: data.length - successCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error: any) {
    logger.error({ error, file: req.file?.originalname }, 'Error processing maternal CSV');
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: 'Error processing upload: ' + error.message });
  }
});

// Upload and process pediatric CSV data (background job + validation + rate limiting)
router.post('/pediatric/upload', uploadLimiter, upload.single('file'), validateUploadedFile, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Use background job if available, otherwise process synchronously
    if (csvProcessingQueue) {
      const job = await csvProcessingQueue.add('process-pediatric-csv', {
        filePath: req.file.path,
        userId: req.user?.id,
      });

      logger.info({ jobId: job.id, filename: req.file.originalname }, 'Pediatric CSV upload queued');

      return res.json({
        success: true,
        message: 'File uploaded and queued for processing',
        jobId: job.id,
      });
    }

    // Fallback: synchronous processing
    logger.info({ filename: req.file.originalname }, 'Processing pediatric CSV synchronously (Redis not available)');
    const fileContent = await fs.readFile(req.file.path, 'utf-8');
    
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
      } catch (error: any) {
        errors.push(`Error processing child ${row.child_id}: ${error.message}`);
      }
    }

    await fs.unlink(req.file.path).catch(() => {});

    // Auto-generate policy scenarios and resource allocations
    try {
      await generatePolicyScenarios();
      await generateResourceAllocations();
    } catch (error: any) {
      logger.warn({ error: error.message }, 'Failed to generate policy/resource data');
    }

    // Invalidate all related caches
    await cache.delPattern('patients:pediatric:*');
    await cache.del('dashboard:stats');
    await cache.del('analytics:insights');
    await cache.del('analytics:trends');

    res.json({
      success: true,
      recordsProcessed: data.length,
      recordsSuccess: successCount,
      recordsFailed: data.length - successCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error: any) {
    logger.error({ error, file: req.file?.originalname }, 'Error processing pediatric CSV');
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: 'Error processing upload: ' + error.message });
  }
});

// Delete maternal patient
router.delete('/maternal/:id', async (req: Request, res: Response) => {
  try {
    await memoryStore.deleteMaternalPatient(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete pediatric patient
router.delete('/pediatric/:id', async (req: Request, res: Response) => {
  try {
    await memoryStore.deletePediatricPatient(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
