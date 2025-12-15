import React, { useState } from 'react';
import { FileTextIcon, DownloadIcon, PrinterIcon, ShareIcon, AlertTriangleIcon, CalendarIcon, BarChartIcon, PieChartIcon, XIcon } from 'lucide-react';
import { useData } from '../context/DataContext';

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const {
    maternalRisks,
    pediatricRisks,
    dashboardStats,
    resourceNeeds,
    isLoading,
    hasLoadedRealData,
    policyScenarios
  } = useData();
  // Empty state when no data has been uploaded
  if (!hasLoadedRealData && !isLoading) {
    return <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
            <p className="text-gray-600 mt-1">
              Generate and export data reports
            </p>
          </div>
        </div>
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <AlertTriangleIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Data Available
          </h2>
          <p className="text-gray-600 mb-6">
            Please upload patient data through the Data Ingestion page to enable
            report generation.
          </p>
          <a href="/data-ingestion" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Go to Data Ingestion
          </a>
        </div>
      </div>;
  }
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      </div>;
  }
  // Calculate current date for report dates
  const currentDate = new Date();
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  const nextWeekDate = new Date(currentDate);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextMonthDate = new Date(currentDate);
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  nextMonthDate.setDate(1);
  const nextQuarterDate = new Date(currentDate);
  nextQuarterDate.setMonth(nextQuarterDate.getMonth() + 3);
  nextQuarterDate.setDate(1);
  // Calculate risk factor frequencies
  const getRiskFactorFrequencies = () => {
    const allRiskFactors = [...maternalRisks, ...pediatricRisks].flatMap(patient => patient.riskFactors);
    const frequencies: Record<string, number> = {};
    allRiskFactors.forEach(factor => {
      frequencies[factor] = (frequencies[factor] || 0) + 1;
    });
    return Object.entries(frequencies).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };
  const topRiskFactors = getRiskFactorFrequencies();

  // Generate report data
  const generateReport = (reportType: string) => {
    let reportData: any = {};

    switch (reportType) {
      case 'risk-distribution':
        reportData = {
          title: 'Risk Distribution Report',
          generatedAt: new Date().toISOString(),
          summary: {
            totalPatients: dashboardStats.totalPatients,
            highRiskPatients: dashboardStats.highRiskPatients,
            maternalPatients: maternalRisks.length,
            pediatricPatients: pediatricRisks.length,
          },
          riskDistribution: {
            maternal: {
              critical: maternalRisks.filter(p => p.riskLevel === 'critical').length,
              high: maternalRisks.filter(p => p.riskLevel === 'high').length,
              medium: maternalRisks.filter(p => p.riskLevel === 'medium').length,
              low: maternalRisks.filter(p => p.riskLevel === 'low').length,
            },
            pediatric: {
              critical: pediatricRisks.filter(p => p.riskLevel === 'critical').length,
              high: pediatricRisks.filter(p => p.riskLevel === 'high').length,
              medium: pediatricRisks.filter(p => p.riskLevel === 'medium').length,
              low: pediatricRisks.filter(p => p.riskLevel === 'low').length,
            },
          },
          topRiskFactors: topRiskFactors,
        };
        break;
      case 'resource-allocation':
        reportData = {
          title: 'Resource Allocation Report',
          generatedAt: new Date().toISOString(),
          resources: resourceNeeds,
          summary: {
            totalRegions: resourceNeeds.length,
            totalNICUBeds: resourceNeeds.reduce((sum, r) => sum + r.nicuBeds, 0),
            totalOBGYNStaff: resourceNeeds.reduce((sum, r) => sum + r.obgynStaff, 0),
            totalVaccineStock: resourceNeeds.reduce((sum, r) => sum + r.vaccineStock, 0),
          },
        };
        break;
      case 'policy-impact':
        reportData = {
          title: 'Policy Impact Report',
          generatedAt: new Date().toISOString(),
          scenarios: policyScenarios.map(s => ({
            name: s.name,
            description: s.description,
            outcomes: s.predictedOutcomes,
          })),
          summary: {
            totalScenarios: policyScenarios.length,
            avgMortalityReduction: policyScenarios.reduce((sum, s) => 
              sum + Math.abs(s.predictedOutcomes.maternalMortality), 0) / policyScenarios.length,
            avgCostIncrease: policyScenarios.reduce((sum, s) => 
              sum + s.predictedOutcomes.costIncrease, 0) / policyScenarios.length,
          },
        };
        break;
    }

    return reportData;
  };

  // View report handler
  const handleViewReport = (reportType: string) => {
    setSelectedReport(reportType);
  };

  // Export report as JSON
  const handleExportReport = (reportType: string, format: 'json' | 'csv') => {
    const reportData = generateReport(reportType);
    
    if (format === 'json') {
      const jsonString = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Convert to CSV format
      let csv = '';
      if (reportData.summary) {
        csv += 'Metric,Value\n';
        Object.entries(reportData.summary).forEach(([key, value]) => {
          csv += `${key},${value}\n`;
        });
      }
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and export data reports</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center">
            <PrinterIcon size={16} className="mr-2" />
            Print Report
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
            <DownloadIcon size={16} className="mr-2" />
            Export PDF
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
            <FileTextIcon size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Available Reports
            </h2>
            <p className="text-gray-600 mt-1">
              Select a report to view or export
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-md hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all">
            <div className="flex items-center mb-2">
              <PieChartIcon size={20} className="text-indigo-600 mr-2" />
              <h3 className="font-medium">Risk Distribution Report</h3>
            </div>
            <p className="text-sm text-gray-600">
              Breakdown of patient risk levels and contributing factors across{' '}
              {maternalRisks.length + pediatricRisks.length} patients
            </p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Last updated: {formatDate(currentDate)}
              </span>
              <button 
                onClick={() => handleViewReport('risk-distribution')}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                View Report
              </button>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-md hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all">
            <div className="flex items-center mb-2">
              <BarChartIcon size={20} className="text-indigo-600 mr-2" />
              <h3 className="font-medium">Resource Allocation Report</h3>
            </div>
            <p className="text-sm text-gray-600">
              Regional resource needs across {resourceNeeds.length} regions and
              allocation recommendations
            </p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Last updated:{' '}
                {formatDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}
              </span>
              <button 
                onClick={() => handleViewReport('resource-allocation')}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                View Report
              </button>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-md hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all">
            <div className="flex items-center mb-2">
              <FileTextIcon size={20} className="text-indigo-600 mr-2" />
              <h3 className="font-medium">Policy Impact Report</h3>
            </div>
            <p className="text-sm text-gray-600">
              Projected outcomes of {policyScenarios.length} policy
              implementations
            </p>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Last updated:{' '}
                {formatDate(new Date(currentDate.setDate(currentDate.getDate() - 2)))}
              </span>
              <button 
                onClick={() => handleViewReport('policy-impact')}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                View Report
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Data Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">
              Patient Data
            </h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    Total Patients
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {dashboardStats.totalPatients}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    Maternal Patients
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {maternalRisks.length}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    Pediatric Patients
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {pediatricRisks.length}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    High Risk Patients
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {dashboardStats.highRiskPatients}
                  </td>
                </tr>
              </tbody>
            </table>
            <h3 className="text-md font-medium text-gray-700 mb-3 mt-6">
              Top Risk Factors
            </h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Risk Factor
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Frequency
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topRiskFactors.map(([factor, count], index) => <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {factor}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{count}</td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3">
              Risk Distribution
            </h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Risk Level
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Maternal
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Pediatric
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700">Critical</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {maternalRisks.filter(p => p.riskLevel === 'critical').length}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {pediatricRisks.filter(p => p.riskLevel === 'critical').length}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700">High</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {maternalRisks.filter(p => p.riskLevel === 'high').length}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {pediatricRisks.filter(p => p.riskLevel === 'high').length}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700">Medium</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {maternalRisks.filter(p => p.riskLevel === 'medium').length}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {pediatricRisks.filter(p => p.riskLevel === 'medium').length}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700">Low</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {maternalRisks.filter(p => p.riskLevel === 'low').length}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {pediatricRisks.filter(p => p.riskLevel === 'low').length}
                  </td>
                </tr>
              </tbody>
            </table>
            <h3 className="text-md font-medium text-gray-700 mb-3 mt-6">
              Resource Allocation
            </h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Region
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    NICU Beds
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    OB-GYN Staff
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resourceNeeds.slice(0, 4).map((resource, index) => <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {resource.region}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {resource.nicuBeds}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {resource.obgynStaff}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Scheduled Reports
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Weekly Risk Summary
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Weekly (Monday)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {Math.ceil(maternalRisks.length / 3)} recipients
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatDate(nextWeekDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Monthly Resource Report
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Monthly (1st)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {resourceNeeds.length + 3} recipients
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatDate(nextMonthDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Quarterly Outcomes Analysis
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Quarterly
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {maternalRisks.length > 0 ? 12 : 8} recipients
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatDate(nextQuarterDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm">
            Schedule New Report
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Report Export Options
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FileTextIcon size={18} className="text-indigo-600 mr-2" />
                <h3 className="font-medium">PDF Report</h3>
              </div>
              <DownloadIcon size={16} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-600">
              Comprehensive formatted report with visualizations
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FileTextIcon size={18} className="text-green-600 mr-2" />
                <h3 className="font-medium">Excel Export</h3>
              </div>
              <DownloadIcon size={16} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-600">
              Raw data export with multiple sheets for analysis
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FileTextIcon size={18} className="text-blue-600 mr-2" />
                <h3 className="font-medium">CSV Export</h3>
              </div>
              <DownloadIcon size={16} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-600">
              Simple data format for system integration
            </p>
          </div>
        </div>
      </div>

      {/* Report Viewer Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {generateReport(selectedReport).title}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExportReport(selectedReport, 'json')}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => handleExportReport(selectedReport, 'csv')}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon size={24} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm">
                {JSON.stringify(generateReport(selectedReport), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>;
};
export default Reports;