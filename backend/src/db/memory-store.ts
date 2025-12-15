import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

// In-memory data store
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: Date;
}

interface MaternalPatient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  riskScore: number;
  riskLevel: string;
  riskFactors: string[];
  lastUpdated: Date;
}

interface PediatricPatient {
  id: string;
  childId: string;
  name: string;
  birthWeight?: string;
  gestationWeeks?: number;
  riskScore: number;
  riskLevel: string;
  riskFactors: string[];
  lastUpdated: Date;
}

interface PolicyScenario {
  id: string;
  scenarioId: string;
  name: string;
  description: string;
  maternalMortalityChange: number;
  infantMortalityChange: number;
  costIncrease: number;
  implementationTime: string;
}

interface ResourceAllocation {
  id: string;
  region: string;
  nicuBeds: number;
  obgynStaff: number;
  vaccineStock: number;
  lastUpdated: Date;
}

class MemoryStore {
  private users: Map<string, User> = new Map();
  private maternalPatients: Map<string, MaternalPatient> = new Map();
  private pediatricPatients: Map<string, PediatricPatient> = new Map();
  private policyScenarios: Map<string, PolicyScenario> = new Map();
  private resourceAllocations: Map<string, ResourceAllocation> = new Map();
  private dataDir = './data';

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Create data directory
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Only load demo data if explicitly enabled
    if (env.LOAD_DEMO_DATA === 'true') {
      console.log('📊 Loading demo data from JSON files...');
      await this.loadData();
    } else {
      console.log('📝 Starting with empty database - CSV upload required for data');
    }
  }

  private async loadData() {
    try {
      const usersData = await fs.readFile(path.join(this.dataDir, 'users.json'), 'utf-8');
      const users = JSON.parse(usersData);
      users.forEach((user: User) => this.users.set(user.id, user));
    } catch (error) {
      // No existing data
    }

    try {
      const maternalData = await fs.readFile(path.join(this.dataDir, 'maternal.json'), 'utf-8');
      const maternal = JSON.parse(maternalData);
      maternal.forEach((p: MaternalPatient) => this.maternalPatients.set(p.patientId, p));
    } catch (error) {
      // No existing data
    }

    try {
      const pediatricData = await fs.readFile(path.join(this.dataDir, 'pediatric.json'), 'utf-8');
      const pediatric = JSON.parse(pediatricData);
      pediatric.forEach((p: PediatricPatient) => this.pediatricPatients.set(p.childId, p));
    } catch (error) {
      // No existing data
    }

    try {
      const policiesData = await fs.readFile(path.join(this.dataDir, 'policies.json'), 'utf-8');
      const policies = JSON.parse(policiesData);
      policies.forEach((p: PolicyScenario) => this.policyScenarios.set(p.scenarioId, p));
    } catch (error) {
      // No existing data
    }

    try {
      const resourcesData = await fs.readFile(path.join(this.dataDir, 'resources.json'), 'utf-8');
      const resources = JSON.parse(resourcesData);
      resources.forEach((r: ResourceAllocation) => this.resourceAllocations.set(r.region, r));
    } catch (error) {
      // No existing data
    }
  }

  async saveData() {
    try {
      await fs.writeFile(
        path.join(this.dataDir, 'users.json'),
        JSON.stringify(Array.from(this.users.values()), null, 2)
      );
      await fs.writeFile(
        path.join(this.dataDir, 'maternal.json'),
        JSON.stringify(Array.from(this.maternalPatients.values()), null, 2)
      );
      await fs.writeFile(
        path.join(this.dataDir, 'pediatric.json'),
        JSON.stringify(Array.from(this.pediatricPatients.values()), null, 2)
      );
      await fs.writeFile(
        path.join(this.dataDir, 'policies.json'),
        JSON.stringify(Array.from(this.policyScenarios.values()), null, 2)
      );
      await fs.writeFile(
        path.join(this.dataDir, 'resources.json'),
        JSON.stringify(Array.from(this.resourceAllocations.values()), null, 2)
      );
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // User operations
  async createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    await this.saveData();
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  // Maternal patient operations
  async createOrUpdateMaternalPatient(data: Omit<MaternalPatient, 'id'>): Promise<MaternalPatient> {
    const existing = this.maternalPatients.get(data.patientId);
    const patient: MaternalPatient = {
      id: existing?.id || uuidv4(),
      ...data,
    };
    this.maternalPatients.set(data.patientId, patient);
    await this.saveData();
    return patient;
  }

  async getMaternalPatients(): Promise<MaternalPatient[]> {
    return Array.from(this.maternalPatients.values());
  }

  async getMaternalPatient(patientId: string): Promise<MaternalPatient | null> {
    return this.maternalPatients.get(patientId) || null;
  }

  async deleteMaternalPatient(patientId: string): Promise<void> {
    this.maternalPatients.delete(patientId);
    await this.saveData();
  }

  // Pediatric patient operations
  async createOrUpdatePediatricPatient(data: Omit<PediatricPatient, 'id'>): Promise<PediatricPatient> {
    const existing = this.pediatricPatients.get(data.childId);
    const patient: PediatricPatient = {
      id: existing?.id || uuidv4(),
      ...data,
    };
    this.pediatricPatients.set(data.childId, patient);
    await this.saveData();
    return patient;
  }

  async getPediatricPatients(): Promise<PediatricPatient[]> {
    return Array.from(this.pediatricPatients.values());
  }

  async getPediatricPatient(childId: string): Promise<PediatricPatient | null> {
    return this.pediatricPatients.get(childId) || null;
  }

  async deletePediatricPatient(childId: string): Promise<void> {
    this.pediatricPatients.delete(childId);
    await this.saveData();
  }

  // Policy scenario operations
  async createPolicyScenario(data: Omit<PolicyScenario, 'id'>): Promise<PolicyScenario> {
    const scenario: PolicyScenario = {
      id: uuidv4(),
      ...data,
    };
    this.policyScenarios.set(data.scenarioId, scenario);
    await this.saveData();
    return scenario;
  }

  async getPolicyScenarios(): Promise<PolicyScenario[]> {
    return Array.from(this.policyScenarios.values());
  }

  async getPolicyScenario(scenarioId: string): Promise<PolicyScenario | null> {
    return this.policyScenarios.get(scenarioId) || null;
  }

  async deletePolicyScenario(scenarioId: string): Promise<void> {
    this.policyScenarios.delete(scenarioId);
    await this.saveData();
  }

  // Resource allocation operations
  async createOrUpdateResourceAllocation(data: Omit<ResourceAllocation, 'id'>): Promise<ResourceAllocation> {
    const existing = this.resourceAllocations.get(data.region);
    const resource: ResourceAllocation = {
      id: existing?.id || uuidv4(),
      ...data,
    };
    this.resourceAllocations.set(data.region, resource);
    await this.saveData();
    return resource;
  }

  async getResourceAllocations(): Promise<ResourceAllocation[]> {
    return Array.from(this.resourceAllocations.values());
  }

  async getResourceAllocation(region: string): Promise<ResourceAllocation | null> {
    return this.resourceAllocations.get(region) || null;
  }

  async deleteResourceAllocation(region: string): Promise<void> {
    this.resourceAllocations.delete(region);
    await this.saveData();
  }
}

export const memoryStore = new MemoryStore();
export type { User, MaternalPatient, PediatricPatient, PolicyScenario, ResourceAllocation };

