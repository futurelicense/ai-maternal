import { PatientRisk, DashboardStats, ResourceAllocation, PolicyScenario } from '../utils/dataModels';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// API call helper with auth
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Authentication
export const authAPI = {
  async login(email: string, password: string) {
    const response = await apiCall<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('authToken', response.token);
    return response;
  },

  async register(email: string, password: string, name: string) {
    const response = await apiCall<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    localStorage.setItem('authToken', response.token);
    return response;
  },

  async verify() {
    return apiCall<{ valid: boolean; user: any }>('/auth/verify');
  },

  logout() {
    localStorage.removeItem('authToken');
  },
};

// Patients
export const patientsAPI = {
  async getMaternalPatients(page: number = 1, limit: number = 1000): Promise<PatientRisk[]> {
    const response = await apiCall<any>('/patients/maternal?page=' + page + '&limit=' + limit);
    // Handle both paginated and non-paginated responses
    const patients = response.data || response || [];
    return patients.map((p: any) => ({
      id: p.patientId,
      name: p.name,
      age: p.age,
      riskScore: p.riskScore,
      riskLevel: p.riskLevel,
      riskFactors: p.riskFactors,
      lastUpdated: p.lastUpdated,
    }));
  },

  async getPediatricPatients(page: number = 1, limit: number = 1000): Promise<PatientRisk[]> {
    const response = await apiCall<any>('/patients/pediatric?page=' + page + '&limit=' + limit);
    // Handle both paginated and non-paginated responses
    const patients = response.data || response || [];
    return patients.map((p: any) => ({
      id: p.childId,
      name: p.name,
      age: 0,
      riskScore: p.riskScore,
      riskLevel: p.riskLevel,
      riskFactors: p.riskFactors,
      lastUpdated: p.lastUpdated,
    }));
  },

  async uploadMaternalCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/patients/maternal/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  async uploadPediatricCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/patients/pediatric/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },
};

// Analytics
export const analyticsAPI = {
  async getDashboardStats(): Promise<DashboardStats> {
    return apiCall<DashboardStats>('/analytics/dashboard');
  },

  async getRiskTrends() {
    return apiCall<any[]>('/analytics/trends');
  },

  async getAIInsights(): Promise<string[]> {
    return apiCall<string[]>('/analytics/insights');
  },

  async getModelPerformance() {
    return apiCall<any[]>('/analytics/model-performance');
  },

  async getRiskFactorAnalysis(type: 'maternal' | 'pediatric') {
    return apiCall<any[]>(`/analytics/risk-factors?type=${type}`);
  },

  async predictRisk(type: 'maternal' | 'pediatric', patientData: any) {
    return apiCall<any>('/analytics/predict-risk', {
      method: 'POST',
      body: JSON.stringify({ type, patientData }),
    });
  },
};

// Digital Twins
export const digitalTwinsAPI = {
  async getDeviations(limit: number = 50) {
    return apiCall<any[]>(`/digital-twins/deviations?limit=${limit}`);
  },

  async getVitalSigns(patientId: string, days: number = 30) {
    return apiCall<any[]>(`/digital-twins/vital-signs/${patientId}?days=${days}`);
  },

  async recordVitalSigns(data: any) {
    return apiCall<any>('/digital-twins/vital-signs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getComparison(patientId: string, days: number = 30) {
    return apiCall<any[]>(`/digital-twins/comparison/${patientId}?days=${days}`);
  },
};

// Policy
export const policyAPI = {
  async getScenarios(): Promise<PolicyScenario[]> {
    return apiCall<PolicyScenario[]>('/policy/scenarios');
  },

  async getScenario(id: string): Promise<PolicyScenario> {
    return apiCall<PolicyScenario>(`/policy/scenarios/${id}`);
  },

  async createScenario(data: { name: string; description: string; targetPopulation: number }) {
    return apiCall<PolicyScenario>('/policy/scenarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async simulatePolicy(data: { name: string; description: string; targetPopulation: number }) {
    return apiCall<any>('/policy/simulate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Resources
export const resourcesAPI = {
  async getAll(): Promise<ResourceAllocation[]> {
    return apiCall<ResourceAllocation[]>('/resources');
  },

  async getByRegion(region: string): Promise<ResourceAllocation> {
    return apiCall<ResourceAllocation>(`/resources/${region}`);
  },

  async createOrUpdate(data: ResourceAllocation) {
    return apiCall<ResourceAllocation>('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getForecast(type: 'nicuBeds' | 'obgynStaff' | 'vaccineStock') {
    return apiCall<any[]>(`/resources/forecast/${type}`);
  },
};

