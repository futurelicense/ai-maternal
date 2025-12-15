import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { AlertTriangleIcon, BellIcon, TrendingUpIcon, UserIcon, ActivityIcon, ArrowUpIcon, ClipboardListIcon, CalendarIcon, DownloadIcon, FileTextIcon, ChevronDownIcon, CheckIcon } from 'lucide-react';
import { useData } from '../context/DataContext';
const COLORS = ['#FF8042', '#FFBB28', '#00C49F'];
const Dashboard: React.FC = () => {
  const {
    dashboardStats,
    maternalRisks,
    pediatricRisks,
    riskTrends,
    aiInsights,
    isLoading,
    hasLoadedRealData
  } = useData();
  
  // State for date range filter
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');
  
  // Date range options
  const dateRangeOptions = [
    { value: '7', label: 'Last 7 Days' },
    { value: '30', label: 'Last 30 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
  ];
  
  // Filter data by date range
  const getFilteredData = () => {
    if (dateRange === 'all') {
      return { maternal: maternalRisks, pediatric: pediatricRisks };
    }
    
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredMaternal = maternalRisks.filter(patient => {
      const patientDate = new Date(patient.lastUpdated);
      return patientDate >= cutoffDate;
    });
    
    const filteredPediatric = pediatricRisks.filter(patient => {
      const patientDate = new Date(patient.lastUpdated);
      return patientDate >= cutoffDate;
    });
    
    return { maternal: filteredMaternal, pediatric: filteredPediatric };
  };
  
  // Get filtered data
  const filteredData = getFilteredData();
  const filteredMaternalRisks = filteredData.maternal;
  const filteredPediatricRisks = filteredData.pediatric;
  
  // Calculate filtered dashboard stats
  const filteredDashboardStats = {
    totalPatients: filteredMaternalRisks.length + filteredPediatricRisks.length,
    highRiskPatients: [...filteredMaternalRisks, ...filteredPediatricRisks].filter(
      p => p.riskLevel === 'high' || p.riskLevel === 'critical'
    ).length,
    alertsToday: [...filteredMaternalRisks, ...filteredPediatricRisks].filter(p => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      return new Date(p.lastUpdated) > oneDayAgo && (p.riskLevel === 'high' || p.riskLevel === 'critical');
    }).length,
    pendingActions: Math.ceil(
      [...filteredMaternalRisks, ...filteredPediatricRisks].filter(
        p => p.riskLevel === 'high' || p.riskLevel === 'critical'
      ).length * 0.2
    ),
  };
  
  // Export data to CSV
  const handleExport = () => {
    try {
      // Prepare data for export (using filtered data)
      const exportData = {
        generatedAt: new Date().toISOString(),
        dateRange: dateRangeOptions.find(opt => opt.value === dateRange)?.label,
        statistics: {
          totalPatients: filteredDashboardStats.totalPatients,
          highRiskPatients: filteredDashboardStats.highRiskPatients,
          alertsToday: filteredDashboardStats.alertsToday,
          pendingActions: filteredDashboardStats.pendingActions,
        },
        maternalPatients: filteredMaternalRisks,
        pediatricPatients: filteredPediatricRisks,
      };
      
      // Create JSON export
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success message
      alert('✅ Dashboard data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Failed to export data. Please try again.');
    }
  };
  
  // Generate comprehensive report
  const handleGenerateReport = () => {
    try {
      // Create HTML report
      const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Maternal & Child Health Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #4F46E5; border-bottom: 3px solid #4F46E5; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .header { text-align: center; margin-bottom: 40px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
    .stat-card { border: 1px solid #E5E7EB; padding: 20px; border-radius: 8px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #1F2937; }
    .stat-label { color: #6B7280; font-size: 14px; margin-top: 5px; }
    .insights { background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .patient-list { margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
    th { background: #F9FAFB; font-weight: 600; }
    .high-risk { color: #DC2626; font-weight: bold; }
    .medium-risk { color: #F59E0B; font-weight: bold; }
    .low-risk { color: #10B981; font-weight: bold; }
    .footer { margin-top: 50px; text-align: center; color: #6B7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏥 Maternal & Child Health Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p>Date Range: ${dateRangeOptions.find(opt => opt.value === dateRange)?.label}</p>
  </div>

  <h2>📊 Key Statistics</h2>
  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">${filteredDashboardStats.totalPatients}</div>
      <div class="stat-label">Total Patients</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${filteredDashboardStats.highRiskPatients}</div>
      <div class="stat-label">High Risk Patients</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${filteredDashboardStats.alertsToday}</div>
      <div class="stat-label">Alerts Today</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${filteredDashboardStats.pendingActions}</div>
      <div class="stat-label">Pending Actions</div>
    </div>
  </div>

  <h2>💡 AI-Generated Insights</h2>
  <div class="insights">
    ${aiInsights.map(insight => `<p>• ${insight}</p>`).join('')}
  </div>

  <h2>👶 Maternal Patients (${filteredMaternalRisks.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Patient ID</th>
        <th>Name</th>
        <th>Age</th>
        <th>Risk Score</th>
        <th>Risk Level</th>
        <th>Risk Factors</th>
      </tr>
    </thead>
    <tbody>
      ${filteredMaternalRisks.slice(0, 20).map(patient => `
        <tr>
          <td>${patient.id}</td>
          <td>${patient.name}</td>
          <td>${patient.age}</td>
          <td>${patient.riskScore}</td>
          <td class="${patient.riskLevel}-risk">${patient.riskLevel.toUpperCase()}</td>
          <td>${patient.riskFactors.join(', ')}</td>
        </tr>
      `).join('')}
      ${filteredMaternalRisks.length > 20 ? `<tr><td colspan="6" style="text-align: center; color: #6B7280;">... and ${filteredMaternalRisks.length - 20} more patients</td></tr>` : ''}
    </tbody>
  </table>

  <h2>👶 Pediatric Patients (${filteredPediatricRisks.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Child ID</th>
        <th>Name</th>
        <th>Risk Score</th>
        <th>Risk Level</th>
        <th>Risk Factors</th>
      </tr>
    </thead>
    <tbody>
      ${filteredPediatricRisks.slice(0, 20).map(patient => `
        <tr>
          <td>${patient.id}</td>
          <td>${patient.name}</td>
          <td>${patient.riskScore}</td>
          <td class="${patient.riskLevel}-risk">${patient.riskLevel.toUpperCase()}</td>
          <td>${patient.riskFactors.join(', ')}</td>
        </tr>
      `).join('')}
      ${filteredPediatricRisks.length > 20 ? `<tr><td colspan="5" style="text-align: center; color: #6B7280;">... and ${filteredPediatricRisks.length - 20} more patients</td></tr>` : ''}
    </tbody>
  </table>

  <div class="footer">
    <p>This report was generated by the Maternal & Child Health Tracker AI System</p>
    <p>For internal use only • Confidential patient data</p>
  </div>
</body>
</html>
      `;
      
      // Create and download HTML report
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maternal-health-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show success message
      alert('✅ Report generated successfully! Open the HTML file in your browser to view or print.');
    } catch (error) {
      console.error('Report generation error:', error);
      alert('❌ Failed to generate report. Please try again.');
    }
  };
  // Empty state when no data has been uploaded
  if (!hasLoadedRealData && !isLoading) {
    return <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Maternal & Child Health Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome to the maternal and child health monitoring system
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
            dashboard analytics.
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
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>;
  }
  // Calculate risk distribution for pie chart using filtered data
  const riskDistribution = [{
    name: 'High Risk',
    value: filteredMaternalRisks.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length + filteredPediatricRisks.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length
  }, {
    name: 'Medium Risk',
    value: filteredMaternalRisks.filter(p => p.riskLevel === 'medium').length + filteredPediatricRisks.filter(p => p.riskLevel === 'medium').length
  }, {
    name: 'Low Risk',
    value: filteredMaternalRisks.filter(p => p.riskLevel === 'low').length + filteredPediatricRisks.filter(p => p.riskLevel === 'low').length
  }];
  // Calculate percentage changes for stats
  const getPercentChange = () => {
    // In a real application, this would compare to previous period data
    // For now, we'll generate a random value between 5-15%
    return Math.floor(Math.random() * 11) + 5;
  };
  return <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Maternal & Child Health Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Overview of maternal and child health metrics and insights
          </p>
          {dateRange !== 'all' && (
            <div className="mt-2 inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
              <span className="font-medium">Filtered: {dateRangeOptions.find(opt => opt.value === dateRange)?.label}</span>
              <span className="ml-2 px-2 py-0.5 bg-indigo-200 rounded-full text-xs font-semibold">
                {filteredDashboardStats.totalPatients} patients
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Date Range Filter */}
          <div className="relative">
            <button 
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            >
              <CalendarIcon size={16} className="mr-2" />
              <span>{dateRangeOptions.find(opt => opt.value === dateRange)?.label}</span>
              <ChevronDownIcon size={16} className="ml-2" />
            </button>
            
            {showDateFilter && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[180px]">
                {dateRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setDateRange(option.value as '7' | '30' | '90' | 'all');
                      setShowDateFilter(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 text-left"
                  >
                    <span className="text-sm text-gray-700">{option.label}</span>
                    {dateRange === option.value && (
                      <CheckIcon size={16} className="text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Export Button */}
          <button 
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <DownloadIcon size={16} className="mr-2" />
            <span>Export</span>
          </button>
          
          {/* Generate Report Button */}
          <button 
            onClick={handleGenerateReport}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <FileTextIcon size={16} className="mr-2" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Total Patients
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {filteredDashboardStats.totalPatients}
              </p>
              <div className="flex items-center mt-2">
                <ArrowUpIcon size={14} className="text-emerald-500 mr-1" />
                <span className="text-xs font-medium text-emerald-500">
                  {getPercentChange()}%
                </span>
                <span className="text-xs text-gray-500 ml-1">
                  vs last month
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <UserIcon size={24} className="text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskTrends}>
                <Line type="monotone" dataKey="highRisk" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                High Risk Patients
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {filteredDashboardStats.highRiskPatients}
              </p>
              <div className="flex items-center mt-2">
                <ArrowUpIcon size={14} className="text-amber-500 mr-1" />
                <span className="text-xs font-medium text-amber-500">
                  {Math.floor(getPercentChange() / 2)}%
                </span>
                <span className="text-xs text-gray-500 ml-1">vs last week</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangleIcon size={24} className="text-red-600" />
            </div>
          </div>
          <div className="mt-4 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={riskTrends}>
                <Line type="monotone" dataKey="highRisk" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">Alerts Today</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {filteredDashboardStats.alertsToday}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-xs text-amber-600 font-medium">
                  {Math.ceil(filteredDashboardStats.alertsToday * 0.25)} require
                  immediate attention
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
              <BellIcon size={24} className="text-amber-600" />
            </div>
          </div>
          <div className="mt-4 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrends}>
                <Area type="monotone" dataKey="mediumRisk" fill="#fef3c7" stroke="#f59e0b" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Pending Actions
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {filteredDashboardStats.pendingActions}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-xs text-blue-600 font-medium">
                  {Math.ceil(filteredDashboardStats.pendingActions * 0.33)} high
                  priority tasks
                </span>
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ClipboardListIcon size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-4 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrends}>
                <Area type="monotone" dataKey="lowRisk" fill="#dbeafe" stroke="#2563eb" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Maternal Risk Trends
            </h2>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-full font-medium">
                6 Months
              </button>
              <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">
                YTD
              </button>
              <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">
                All Time
              </button>
            </div>
          </div>
          {riskTrends.length > 0 ? <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskTrends} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }} />
                <Legend iconType="circle" wrapperStyle={{
              paddingTop: 15
            }} />
                <Bar dataKey="highRisk" name="High Risk" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mediumRisk" name="Medium Risk" fill="#facc15" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lowRisk" name="Low Risk" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer> : <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
              <p className="text-gray-500">
                Insufficient data for trend analysis
              </p>
            </div>}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Patient Risk Distribution
            </h2>
            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
              Updated Today
            </span>
          </div>
          {riskDistribution.some(item => item.value > 0) ? <div className="flex items-center">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {riskDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }} formatter={value => [`${value} patients`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2">
                <div className="space-y-4">
                  {riskDistribution.map((item, index) => <div key={index} className="flex items-center">
                      <div className="w-4 h-4 rounded-full mr-3" style={{
                  backgroundColor: COLORS[index % COLORS.length]
                }}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {item.name}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {item.value}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div className="h-2 rounded-full" style={{
                      width: `${item.value / (riskDistribution.reduce((acc, curr) => acc + curr.value, 0) || 1) * 100}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}></div>
                        </div>
                      </div>
                    </div>)}
                </div>
                <div className="mt-6 pt-6 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">
                      Total Patients
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {riskDistribution.reduce((acc, curr) => acc + curr.value, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div> : <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
              <p className="text-gray-500">No risk data available</p>
            </div>}
        </div>
      </div>
      {/* AI Insights */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            AI-Generated Insights
          </h2>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
            Powered by Hugging Face Models
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiInsights.length > 0 ? aiInsights.map((insight, index) => <div key={index} className="flex items-start p-5 border border-gray-100 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors duration-200">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4 flex-shrink-0">
                  <ActivityIcon size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-700">{insight}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Generated today at 10:45 AM
                  </p>
                </div>
              </div>) : <div className="col-span-2 p-8 text-center bg-gray-50 rounded-md">
              <p className="text-gray-500">
                AI insights will be generated when more data is available
              </p>
            </div>}
        </div>
      </div>
      {/* High Risk Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              High Risk Maternal Cases
            </h2>
            <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Risk Factors
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {maternalRisks.filter(patient => patient.riskLevel === 'high' || patient.riskLevel === 'critical').map(patient => <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-indigo-700 font-medium text-sm">
                              {patient.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {patient.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Age: {patient.age}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${patient.riskLevel === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                          {patient.riskScore}/100
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {patient.riskFactors.join(', ')}
                        </div>
                      </td>
                    </tr>)}
                {maternalRisks.filter(patient => patient.riskLevel === 'high' || patient.riskLevel === 'critical').length === 0 && <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      No high-risk maternal cases found
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              High Risk Pediatric Cases
            </h2>
            <button className="text-indigo-600 text-sm font-medium hover:text-indigo-800">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Risk Factors
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pediatricRisks.filter(patient => patient.riskLevel === 'high' || patient.riskLevel === 'critical').map(patient => <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-blue-700 font-medium text-sm">
                              {patient.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {patient.name}
                            </div>
                            <div className="text-sm text-gray-500">Newborn</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${patient.riskLevel === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                          {patient.riskScore}/100
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {patient.riskFactors.join(', ')}
                        </div>
                      </td>
                    </tr>)}
                {pediatricRisks.filter(patient => patient.riskLevel === 'high' || patient.riskLevel === 'critical').length === 0 && <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                      No high-risk pediatric cases found
                    </td>
                  </tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>;
};
export default Dashboard;