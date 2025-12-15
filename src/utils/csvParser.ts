import Papa from 'papaparse';
import { PatientRisk, RiskLevel } from './dataModels';
/**
 * CSV parsing options
 */
const parseOptions = {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header: string) => header.trim().toLowerCase(),
  transform: (value: string) => value.trim()
};
/**
 * CSV validation schemas
 */
const requiredMaternalColumns = ['patient_id', 'name', 'age', 'risk_factors', 'risk_score', 'risk_level', 'last_updated'];
const requiredPediatricColumns = ['child_id', 'name', 'birth_weight', 'gestation_weeks', 'risk_factors', 'risk_score', 'risk_level', 'last_updated'];
/**
 * Parse a CSV file and return the structured data
 */
export const parseCSV = async (file: File): Promise<{
  data: any[];
  errors: any[];
}> => {
  return new Promise((resolve, reject) => {
    // Read the file as text first to avoid I/O issues
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        
        Papa.parse(csvText, {
          ...parseOptions,
          complete: results => {
            resolve({
              data: results.data,
              errors: results.errors
            });
          },
          error: error => {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read the file as text
    reader.readAsText(file, 'UTF-8');
  });
};
/**
 * Validate the CSV structure against the expected schema
 */
export const validateCSV = (data: any[], type: 'maternal' | 'pediatric'): {
  valid: boolean;
  message: string;
  details?: string[];
} => {
  const requiredColumns = type === 'maternal' ? requiredMaternalColumns : requiredPediatricColumns;
  if (data.length === 0) {
    return {
      valid: false,
      message: 'The file contains no data rows'
    };
  }
  // Check if all required columns exist
  const firstRow = data[0];
  const missingColumns = requiredColumns.filter(column => !Object.keys(firstRow).includes(column));
  if (missingColumns.length > 0) {
    return {
      valid: false,
      message: 'Missing required columns',
      details: missingColumns.map(col => `Missing required column: ${col}`)
    };
  }
  // Check for data quality issues
  const dataIssues: string[] = [];
  let rowsWithIssues = 0;
  data.forEach((row, index) => {
    // Check for required fields
    for (const col of requiredColumns) {
      if (!row[col] || row[col].toString().trim() === '') {
        dataIssues.push(`Row ${index + 1}: Missing value for ${col}`);
        rowsWithIssues++;
        break; // Only report one issue per row to avoid overwhelming
      }
    }
  });
  if (rowsWithIssues > 0) {
    return {
      valid: false,
      message: `Data quality issues found in ${rowsWithIssues} rows`,
      details: dataIssues.slice(0, 5) // Limit to first 5 issues
    };
  }
  return {
    valid: true,
    message: `${type === 'maternal' ? 'Maternal' : 'Pediatric'} health dataset validated successfully`,
    details: [`Schema matches expected format`, `${data.length} records identified`, `No missing required fields`]
  };
};
/**
 * Transform CSV data into application data models
 */
export const transformMaternalData = (data: any[]): PatientRisk[] => {
  return data.map(row => ({
    id: row.patient_id,
    name: row.name,
    age: parseInt(row.age),
    riskScore: parseInt(row.risk_score),
    riskLevel: (row.risk_level?.toLowerCase() || 'medium') as RiskLevel,
    riskFactors: row.risk_factors.split(',').map((factor: string) => factor.trim()),
    lastUpdated: row.last_updated
  }));
};
export const transformPediatricData = (data: any[]): PatientRisk[] => {
  return data.map(row => ({
    id: row.child_id,
    name: row.name,
    age: 0,
    // Pediatric patients are newborns
    riskScore: parseInt(row.risk_score),
    riskLevel: (row.risk_level?.toLowerCase() || 'medium') as RiskLevel,
    riskFactors: row.risk_factors.split(',').map((factor: string) => factor.trim()),
    lastUpdated: row.last_updated
  }));
};
/**
 * Process statistics from patient data
 */
export const calculateDashboardStats = (maternalData: PatientRisk[], pediatricData: PatientRisk[]) => {
  const allPatients = [...maternalData, ...pediatricData];
  const highRiskPatients = allPatients.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical');
  // In a real app, alerts would be generated from various sources
  // Here we'll simulate based on high risk patients and recent updates
  const recentUpdates = allPatients.filter(p => {
    const updateDate = new Date(p.lastUpdated);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return updateDate > oneDayAgo;
  });
  return {
    totalPatients: allPatients.length,
    highRiskPatients: highRiskPatients.length,
    alertsToday: Math.min(highRiskPatients.length, recentUpdates.length),
    pendingActions: Math.ceil(highRiskPatients.length * 0.2) // Simulate pending actions
  };
};