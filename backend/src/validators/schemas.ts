import { z } from 'zod';

// Authentication schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Patient schemas
export const maternalPatientSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  name: z.string().min(1, 'Name is required').max(200),
  age: z.number().int().min(0).max(150, 'Invalid age'),
  riskScore: z.number().int().min(0).max(100).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  riskFactors: z.array(z.string()).min(1, 'At least one risk factor is required'),
  lastUpdated: z.string().datetime().or(z.date()).optional(),
});

export const pediatricPatientSchema = z.object({
  childId: z.string().min(1, 'Child ID is required'),
  name: z.string().min(1, 'Name is required').max(200),
  birthWeight: z.string().optional(),
  gestationWeeks: z.number().int().min(20).max(45).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  riskFactors: z.array(z.string()).min(1, 'At least one risk factor is required'),
  lastUpdated: z.string().datetime().or(z.date()).optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
}).refine((data) => data.page > 0, {
  message: 'Page must be greater than 0',
  path: ['page'],
}).refine((data) => data.limit > 0 && data.limit <= 100, {
  message: 'Limit must be between 1 and 100',
  path: ['limit'],
});

export const filterSchema = z.object({
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
});

// Policy simulation schema
export const policySimulationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  targetPopulation: z.number().int().min(1, 'Target population must be at least 1'),
});

// Resource allocation schema
export const resourceAllocationSchema = z.object({
  region: z.string().min(1, 'Region is required').max(100),
  nicuBeds: z.number().int().min(0),
  obgynStaff: z.number().int().min(0),
  vaccineStock: z.number().int().min(0),
});

// Risk prediction schema
export const maternalRiskPredictionSchema = z.object({
  type: z.literal('maternal'),
  patientData: z.object({
    age: z.number().int().min(0).max(150),
    riskFactors: z.array(z.string()).min(1),
    vitalSigns: z.object({
      systolic: z.number().min(0).max(300).optional(),
      diastolic: z.number().min(0).max(200).optional(),
      weight: z.number().min(0).max(500).optional(),
    }).optional(),
  }),
});

export const pediatricRiskPredictionSchema = z.object({
  type: z.literal('pediatric'),
  patientData: z.object({
    birthWeight: z.number().min(0).max(10).optional(),
    gestationWeeks: z.number().int().min(20).max(45).optional(),
    riskFactors: z.array(z.string()).min(1),
  }),
});

export const riskPredictionSchema = z.discriminatedUnion('type', [
  maternalRiskPredictionSchema,
  pediatricRiskPredictionSchema,
]);

// File upload validation
export const fileUploadSchema = z.object({
  mimetype: z.enum(['text/csv', 'application/vnd.ms-excel']),
  size: z.number().max(10485760, 'File size must be less than 10MB'), // 10MB
});
