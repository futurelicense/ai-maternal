import { Router, Request, Response } from 'express';
import { memoryStore } from '../db/memory-store.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

// Get all resource allocations
router.get('/', async (req: Request, res: Response) => {
  try {
    const resources = await memoryStore.getResourceAllocations();
    res.json(resources);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get resource allocation by region
router.get('/:region', async (req: Request, res: Response) => {
  try {
    const resource = await memoryStore.getResourceAllocation(req.params.region);

    if (!resource) {
      return res.status(404).json({ error: 'Region not found' });
    }

    res.json(resource);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update resource allocation
router.post('/', async (req: Request, res: Response) => {
  try {
    const { region, nicuBeds, obgynStaff, vaccineStock } = req.body;

    const resource = await memoryStore.createOrUpdateResourceAllocation({
      region,
      nicuBeds,
      obgynStaff,
      vaccineStock,
      lastUpdated: new Date(),
    });

    res.json(resource);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get resource forecast
router.get('/forecast/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    const resources = await memoryStore.getResourceAllocations();
    const maternal = await memoryStore.getMaternalPatients();
    const pediatric = await memoryStore.getPediatricPatients();

    const highRiskCount = [...maternal, ...pediatric].filter(
      p => p.riskLevel === 'high' || p.riskLevel === 'critical'
    ).length;

    const growthFactor = 0.1 + (highRiskCount * 0.01);

    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const averageValue = resources.reduce((sum, r) => {
      const value = type === 'nicuBeds' ? r.nicuBeds : type === 'obgynStaff' ? r.obgynStaff : r.vaccineStock;
      return sum + value;
    }, 0) / (resources.length || 1);

    const forecast = months.map((month, index) => ({
      month,
      current: averageValue,
      forecast: Math.round(averageValue * (1 + growthFactor * (index + 1))),
    }));

    res.json(forecast);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete resource allocation
router.delete('/:region', async (req: Request, res: Response) => {
  try {
    await memoryStore.deleteResourceAllocation(req.params.region);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
