import { Router, Request, Response } from 'express';
import { memoryStore } from '../db/memory-store.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { huggingFaceService } from '../services/huggingface.service.js';

const router = Router();
router.use(authenticate);

// Get all policy scenarios
router.get('/scenarios', async (req: Request, res: Response) => {
  try {
    const scenarios = await memoryStore.getPolicyScenarios();
    
    // Format for frontend
    const formatted = scenarios.map(s => ({
      id: s.scenarioId,
      name: s.name,
      description: s.description,
      predictedOutcomes: {
        maternalMortality: s.maternalMortalityChange,
        infantMortality: s.infantMortalityChange,
        costIncrease: s.costIncrease,
        implementationTime: s.implementationTime,
      },
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single policy scenario
router.get('/scenarios/:id', async (req: Request, res: Response) => {
  try {
    const scenario = await memoryStore.getPolicyScenario(req.params.id);

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json({
      id: scenario.scenarioId,
      name: scenario.name,
      description: scenario.description,
      predictedOutcomes: {
        maternalMortality: scenario.maternalMortalityChange,
        infantMortality: scenario.infantMortalityChange,
        costIncrease: scenario.costIncrease,
        implementationTime: scenario.implementationTime,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new policy scenario
router.post('/scenarios', async (req: Request, res: Response) => {
  try {
    const { name, description, targetPopulation } = req.body;

    // Use AI to simulate policy impact
    const simulation = await huggingFaceService.simulatePolicy({
      name,
      description,
      targetPopulation: targetPopulation || 1000,
    });

    const scenarioId = `PS${Date.now().toString().slice(-6)}`;

    const scenario = await memoryStore.createPolicyScenario({
      scenarioId,
      name,
      description,
      maternalMortalityChange: simulation.maternalMortalityChange,
      infantMortalityChange: simulation.infantMortalityChange,
      costIncrease: simulation.costIncrease,
      implementationTime: '6-12 months',
    });

    res.json({
      id: scenario.scenarioId,
      name: scenario.name,
      description: scenario.description,
      predictedOutcomes: {
        maternalMortality: scenario.maternalMortalityChange,
        infantMortality: scenario.infantMortalityChange,
        costIncrease: scenario.costIncrease,
        implementationTime: scenario.implementationTime,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate policy impact
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const { name, description, targetPopulation } = req.body;

    const simulation = await huggingFaceService.simulatePolicy({
      name,
      description,
      targetPopulation: targetPopulation || 1000,
    });

    res.json(simulation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete policy scenario
router.delete('/scenarios/:id', async (req: Request, res: Response) => {
  try {
    await memoryStore.deletePolicyScenario(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
