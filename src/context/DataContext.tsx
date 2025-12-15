import React, { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react';
import { PatientRisk, DashboardStats, ResourceAllocation, RiskTrend, PolicyScenario } from '../utils/dataModels';
import { patientsAPI, analyticsAPI, policyAPI, resourcesAPI, authAPI } from '../services/apiClient';

interface DataContextType {
  // Patient data
  maternalRisks: PatientRisk[];
  pediatricRisks: PatientRisk[];
  // Dashboard stats
  dashboardStats: DashboardStats;
  // Resource allocation
  resourceNeeds: ResourceAllocation[];
  // Trends and insights
  riskTrends: RiskTrend[];
  aiInsights: string[];
  // Policy scenarios
  policyScenarios: PolicyScenario[];
  // Data state
  isLoading: boolean;
  error: string | null;
  // Has real data been loaded?
  hasLoadedRealData: boolean;
  // Authentication
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  // Functions to refresh data
  refreshData: () => Promise<void>;
  refreshPatients: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialDashboardStats: DashboardStats = {
  totalPatients: 0,
  highRiskPatients: 0,
  alertsToday: 0,
  pendingActions: 0,
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [maternalRisks, setMaternalRisks] = useState<PatientRisk[]>([]);
  const [pediatricRisks, setPediatricRisks] = useState<PatientRisk[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(initialDashboardStats);
  const [resourceNeeds, setResourceNeeds] = useState<ResourceAllocation[]>([]);
  const [riskTrends, setRiskTrends] = useState<RiskTrend[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [policyScenarios, setPolicyScenarios] = useState<PolicyScenario[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedRealData, setHasLoadedRealData] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await authAPI.verify();
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();
  }, []);

  // Refresh patients data
  const refreshPatients = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [maternal, pediatric] = await Promise.all([
        patientsAPI.getMaternalPatients(),
        patientsAPI.getPediatricPatients(),
      ]);

      setMaternalRisks(maternal);
      setPediatricRisks(pediatric);

      if (maternal.length > 0 || pediatric.length > 0) {
        setHasLoadedRealData(true);
      }
    } catch (err: any) {
      console.error('Error refreshing patients:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        maternal,
        pediatric,
        stats,
        trends,
        insights,
        policies,
        resources,
      ] = await Promise.all([
        patientsAPI.getMaternalPatients().catch(() => []),
        patientsAPI.getPediatricPatients().catch(() => []),
        analyticsAPI.getDashboardStats().catch(() => initialDashboardStats),
        analyticsAPI.getRiskTrends().catch(() => []),
        analyticsAPI.getAIInsights().catch(() => []),
        policyAPI.getScenarios().catch(() => []),
        resourcesAPI.getAll().catch(() => []),
      ]);

      setMaternalRisks(maternal);
      setPediatricRisks(pediatric);
      setDashboardStats(stats);
      setRiskTrends(trends);
      setAiInsights(insights);
      setPolicyScenarios(policies);
      setResourceNeeds(resources);

      if (maternal.length > 0 || pediatric.length > 0) {
        setHasLoadedRealData(true);
      }
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated, refreshData]);

  const value: DataContextType = {
    maternalRisks,
    pediatricRisks,
    dashboardStats,
    resourceNeeds,
    riskTrends,
    aiInsights,
    policyScenarios,
    isLoading,
    error,
    hasLoadedRealData,
    isAuthenticated,
    setIsAuthenticated,
    refreshData,
    refreshPatients,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
