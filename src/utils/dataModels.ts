// Data models for the application
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export interface PatientRisk {
  id: string;
  name: string;
  age: number;
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  lastUpdated: string;
}
export interface DashboardStats {
  totalPatients: number;
  highRiskPatients: number;
  alertsToday: number;
  pendingActions: number;
}
export interface ResourceAllocation {
  region: string;
  nicuBeds: number;
  obgynStaff: number;
  vaccineStock: number;
}
export interface TwinDeviation {
  patientId: string;
  parameter: string;
  expected: string;
  actual: string;
  deviationPercent: number;
  timestamp: string;
}
export interface RiskTrend {
  month: string;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}
export interface PolicyScenario {
  id: string;
  name: string;
  description: string;
  predictedOutcomes: {
    maternalMortality: number;
    infantMortality: number;
    costIncrease: number;
    implementationTime: string;
  };
}