import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

// In-memory storage for digital twin data
const deviations: any[] = [];
const vitalSigns: any[] = [];

// Get digital twin deviations
router.get('/deviations', async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;
    const limitedDeviations = deviations.slice(0, Number(limit));
    res.json(limitedDeviations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get vital signs for a patient
router.get('/vital-signs/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { days = 30 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const patientVitals = vitalSigns
      .filter(v => v.patientId === patientId && new Date(v.timestamp) > daysAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(patientVitals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record vital signs
router.post('/vital-signs', async (req: Request, res: Response) => {
  try {
    const { patientId, patientType, systolic, diastolic, heartRate, bloodGlucose, weight, temperature } = req.body;

    const vital = {
      id: `vital-${Date.now()}`,
      patientId,
      patientType,
      systolic,
      diastolic,
      heartRate,
      bloodGlucose,
      weight,
      temperature,
      timestamp: new Date().toISOString(),
    };

    vitalSigns.push(vital);
    res.json(vital);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record deviation
router.post('/deviations', async (req: Request, res: Response) => {
  try {
    const { patientId, patientType, parameter, expectedValue, actualValue, deviationPercent } = req.body;

    const deviation = {
      id: `deviation-${Date.now()}`,
      patientId,
      patientType,
      parameter,
      expectedValue,
      actualValue,
      deviationPercent,
      timestamp: new Date().toISOString(),
    };

    deviations.push(deviation);
    res.json(deviation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get twin comparison data
router.get('/comparison/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { days = 30 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    const patientVitals = vitalSigns
      .filter(v => v.patientId === patientId && new Date(v.timestamp) > daysAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Generate predicted vs actual comparison
    const comparison = patientVitals.map((vital, index) => ({
      day: index + 1,
      predicted: 120 - (index * 0.5), // Simplified prediction
      actual: parseFloat(vital.systolic || '120'),
      timestamp: vital.timestamp,
    }));

    res.json(comparison);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
