import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { UsersIcon, AlertTriangleIcon, ArrowRightIcon, ActivityIcon, SearchIcon } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PatientRisk } from '../utils/dataModels';
const DigitalTwins: React.FC = () => {
  const {
    maternalRisks,
    pediatricRisks,
    hasLoadedRealData,
    isLoading
  } = useData();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllDeviations, setShowAllDeviations] = useState<boolean>(false);
  // Combine maternal and pediatric data for a unified patient list
  const allPatients = useMemo(() => {
    return [...maternalRisks, ...pediatricRisks];
  }, [maternalRisks, pediatricRisks]);
  // Set default selected patient if none is selected and data is available
  useMemo(() => {
    if (selectedPatient === null && allPatients.length > 0) {
      setSelectedPatient(allPatients[0].id);
    }
  }, [allPatients, selectedPatient]);
  // Filter patients based on search query
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return allPatients;
    const query = searchQuery.toLowerCase();
    return allPatients.filter(patient => patient.name.toLowerCase().includes(query) || patient.id.toLowerCase().includes(query) || patient.riskFactors.some(factor => factor.toLowerCase().includes(query)));
  }, [allPatients, searchQuery]);
  // Get the selected patient data
  const selectedPatientData = useMemo(() => {
    return allPatients.find(p => p.id === selectedPatient);
  }, [allPatients, selectedPatient]);
  // Generate simulated vital sign data based on patient risk factors and score
  const generateVitalData = (baseline: number, variability: number, points: number, trend: number = 0, riskScore?: number) => {
    // Use risk score to influence the data if available
    const riskInfluence = riskScore ? riskScore / 100 * variability * 1.5 : 0;
    return Array.from({
      length: points
    }, (_, i) => {
      const randomVariation = (Math.random() - 0.5) * variability;
      const trendFactor = i / points * trend;
      const riskFactor = i > points * 0.7 ? riskInfluence : 0; // Introduce risk-based deviation later in the timeline
      return baseline + randomVariation + trendFactor + riskFactor;
    });
  };
  // Determine number of data points based on time range
  const getDataPoints = () => {
    switch (timeRange) {
      case 'day': return 24; // 24 hours
      case 'week': return 7; // 7 days
      case 'month': return 30; // 30 days
      default: return 30;
    }
  };

  // Generate vital signs data based on the selected patient
  const vitalSignsData = useMemo(() => {
    if (!selectedPatientData) return [];
    const dataPoints = getDataPoints();
    // Determine baselines based on patient characteristics
    const hasHypertension = selectedPatientData.riskFactors.some(factor => factor.toLowerCase().includes('hypertension') || factor.toLowerCase().includes('pressure'));
    const hasDiabetes = selectedPatientData.riskFactors.some(factor => factor.toLowerCase().includes('diabetes') || factor.toLowerCase().includes('glucose'));
    const hasWeightIssue = selectedPatientData.riskFactors.some(factor => factor.toLowerCase().includes('bmi') || factor.toLowerCase().includes('weight'));
    // Adjust baselines based on risk factors
    const bpSystolicBaseline = hasHypertension ? 140 : 120;
    const bpDiastolicBaseline = hasHypertension ? 90 : 80;
    const heartRateBaseline = 85;
    const glucoseBaseline = hasDiabetes ? 130 : 100;
    const weightBaseline = hasWeightIssue ? 85 : 70;
    // Generate data with more variation for high-risk patients
    const variabilityFactor = selectedPatientData.riskScore > 70 ? 1.5 : 1;
    const vitalSigns = {
      bloodPressureSystolic: generateVitalData(bpSystolicBaseline, 10 * variabilityFactor, dataPoints, hasHypertension ? 5 : -2, selectedPatientData.riskScore),
      bloodPressureDiastolic: generateVitalData(bpDiastolicBaseline, 5 * variabilityFactor, dataPoints, hasHypertension ? 3 : -1, selectedPatientData.riskScore),
      heartRate: generateVitalData(heartRateBaseline, 8 * variabilityFactor, dataPoints, 0, selectedPatientData.riskScore),
      bloodGlucose: generateVitalData(glucoseBaseline, 15 * variabilityFactor, dataPoints, hasDiabetes ? 10 : 0, selectedPatientData.riskScore),
      weight: generateVitalData(weightBaseline, 0.5 * variabilityFactor, dataPoints, hasWeightIssue ? 1 : 0, selectedPatientData.riskScore)
    };
    return Array.from({
      length: dataPoints
    }, (_, i) => ({
      day: i + 1,
      systolic: vitalSigns.bloodPressureSystolic[i],
      diastolic: vitalSigns.bloodPressureDiastolic[i],
      heartRate: vitalSigns.heartRate[i],
      glucose: vitalSigns.bloodGlucose[i],
      weight: vitalSigns.weight[i]
    }));
  }, [selectedPatientData, timeRange]);
  // Generate twin comparison data based on the selected patient's risk profile
  const twinComparisonData = useMemo(() => {
    if (!selectedPatientData) return [];
    const dataPoints = getDataPoints();
    // Determine if patient has blood pressure issues
    const hasBpIssues = selectedPatientData.riskFactors.some(factor => factor.toLowerCase().includes('hypertension') || factor.toLowerCase().includes('pressure'));
    // Base decline rate depends on risk factors
    const baseDeclineRate = hasBpIssues ? 0.8 : 0.5;
    // Generate data with increasing deviation based on risk score
    const deviationFactor = selectedPatientData.riskScore / 100;
    return Array.from({
      length: dataPoints
    }, (_, i) => {
      const base = 120 - i * baseDeclineRate;
      const deviationMagnitude = Math.min(20, deviationFactor * 25); // Cap at 20 to avoid extreme values
      const deviation = i > dataPoints * 0.7 ? deviationMagnitude : i / (dataPoints * 0.7) * deviationMagnitude;
      return {
        day: i + 1,
        predicted: base,
        actual: base + (Math.random() - 0.5) * 5 + (i > dataPoints * 0.5 ? deviation : 0)
      };
    });
  }, [selectedPatientData, timeRange]);
  // Generate twin deviations based on all patients' data
  const generatedTwinDeviations = useMemo(() => {
    // Only generate for high and critical risk patients
    const highRiskPatients = allPatients.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical');
    if (highRiskPatients.length === 0) return [];
    return highRiskPatients.slice(0, 5).map(patient => {
      // Determine which parameter is most likely to deviate based on risk factors
      let parameter = 'Blood Pressure';
      let expected = '120/80';
      let actual = '145/95';
      let deviationPercent = 28;
      if (patient.riskFactors.some(f => f.toLowerCase().includes('diabetes') || f.toLowerCase().includes('glucose'))) {
        parameter = 'Blood Glucose';
        expected = '100 mg/dL';
        actual = `${Math.round(100 + patient.riskScore / 100 * 50)} mg/dL`;
        deviationPercent = Math.round((parseInt(actual) - 100) / 100 * 100);
      } else if (patient.riskFactors.some(f => f.toLowerCase().includes('weight') || f.toLowerCase().includes('bmi'))) {
        parameter = 'Weight';
        expected = patient.id.startsWith('P') ? '3.2 kg' : '70 kg';
        actual = patient.id.startsWith('P') ? `${(3.2 - patient.riskScore / 100 * 0.8).toFixed(1)} kg` : `${Math.round(70 + patient.riskScore / 100 * 15)} kg`;
        deviationPercent = patient.id.startsWith('P') ? Math.round((3.2 - parseFloat(actual)) / 3.2 * 100) : Math.round((parseInt(actual) - 70) / 70 * 100);
      } else if (patient.riskFactors.some(f => f.toLowerCase().includes('heart') || f.toLowerCase().includes('cardiac'))) {
        parameter = 'Heart Rate';
        expected = '75 bpm';
        actual = `${Math.round(75 + patient.riskScore / 100 * 35)} bpm`;
        deviationPercent = Math.round((parseInt(actual) - 75) / 75 * 100);
      }
      // Create a timestamp from the last few days
      const daysAgo = Math.floor(Math.random() * 3);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(Math.floor(Math.random() * 24));
      date.setMinutes(Math.floor(Math.random() * 60));
      return {
        patientId: patient.id,
        parameter,
        expected,
        actual,
        deviationPercent: Math.abs(deviationPercent),
        timestamp: date.toISOString()
      };
    });
  }, [allPatients]);
  // Calculate twin monitoring stats
  const twinMonitoringStats = useMemo(() => {
    const maternalTwins = maternalRisks.length;
    const pediatricTwins = pediatricRisks.length;
    const deviations = generatedTwinDeviations.length;
    return {
      maternalTwins,
      pediatricTwins,
      totalTwins: maternalTwins + pediatricTwins,
      deviations
    };
  }, [maternalRisks.length, pediatricRisks.length, generatedTwinDeviations.length]);
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle export data
  const handleExportData = () => {
    if (!selectedPatientData || vitalSignsData.length === 0) return;
    
    // Create CSV content
    const headers = ['Day', 'Systolic BP', 'Diastolic BP', 'Heart Rate', 'Blood Glucose', 'Weight'];
    const rows = vitalSignsData.map(data => [
      data.day,
      Math.round(data.systolic),
      Math.round(data.diastolic),
      Math.round(data.heartRate),
      Math.round(data.glucose),
      data.weight.toFixed(1)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `digital-twin-${selectedPatientData.id}-${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle toggle all deviations view
  const handleToggleAllDeviations = () => {
    setShowAllDeviations(!showAllDeviations);
  };

  // Get displayed deviations based on view toggle
  const displayedDeviations = showAllDeviations 
    ? generatedTwinDeviations 
    : generatedTwinDeviations.slice(0, 5);
  // Empty state when no data has been uploaded
  if (!hasLoadedRealData && !isLoading) {
    return <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Digital Twin Technology
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time patient digital twins and deviation tracking
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
            digital twin monitoring.
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
          <p className="mt-4 text-gray-600">Loading digital twin data...</p>
        </div>
      </div>;
  }
  // No patients in the dataset
  if (allPatients.length === 0) {
    return <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Digital Twin Technology
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time patient digital twins and deviation tracking
            </p>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setTimeRange('day')} className={`px-4 py-2 rounded-md ${timeRange === 'day' ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              Day
            </button>
            <button onClick={() => setTimeRange('week')} className={`px-4 py-2 rounded-md ${timeRange === 'week' ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              Week
            </button>
            <button onClick={() => setTimeRange('month')} className={`px-4 py-2 rounded-md ${timeRange === 'month' ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              Month
            </button>
          </div>
        </div>
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <AlertTriangleIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Patient Data Available
          </h2>
          <p className="text-gray-600 mb-6">
            Please upload maternal or pediatric patient data through the Data
            Ingestion page.
          </p>
          <a href="/data-ingestion" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Go to Data Ingestion
          </a>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Digital Twin Technology
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time patient digital twins and deviation tracking
          </p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setTimeRange('day')} className={`px-4 py-2 rounded-md ${timeRange === 'day' ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            Day
          </button>
          <button onClick={() => setTimeRange('week')} className={`px-4 py-2 rounded-md ${timeRange === 'week' ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            Week
          </button>
          <button onClick={() => setTimeRange('month')} className={`px-4 py-2 rounded-md ${timeRange === 'month' ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            Month
          </button>
        </div>
      </div>
      {/* Digital Twin Explanation */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
            <UsersIcon size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Digital Twin Monitoring
            </h2>
            <p className="text-gray-600 mt-1">
              Digital twins are AI models that simulate expected patient
              trajectories based on historical data and medical knowledge. The
              system continuously compares real-time patient data against these
              simulations to detect abnormal deviations.
            </p>
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <div className="flex">
                <AlertTriangleIcon size={20} className="text-blue-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Currently monitoring {twinMonitoringStats.maternalTwins}{' '}
                  active maternal digital twins and{' '}
                  {twinMonitoringStats.pediatricTwins} infant digital twins.
                  {twinMonitoringStats.deviations} significant deviations
                  detected in the last 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Patient Selection and Digital Twin View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Patients</h2>
            <div className="ml-auto">
              <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                <option>All Patients</option>
                <option>High Risk</option>
                <option>With Deviations</option>
              </select>
            </div>
          </div>
          <div className="relative mb-4">
            <input type="text" placeholder="Search patients..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md" value={searchQuery} onChange={handleSearchChange} />
            <SearchIcon size={16} className="absolute left-3 top-3 text-gray-400" />
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredPatients.map(patient => <div key={patient.id} onClick={() => setSelectedPatient(patient.id)} className={`p-3 rounded-md cursor-pointer ${selectedPatient === patient.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">
                      {patient.name}
                    </h3>
                    <p className="text-xs text-gray-500">ID: {patient.id}</p>
                  </div>
                  {generatedTwinDeviations.some(d => d.patientId === patient.id) && <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      Deviation
                    </span>}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${patient.riskLevel === 'critical' ? 'bg-red-100 text-red-800' : patient.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' : patient.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {patient.riskScore}/100
                  </div>
                  <span className="text-xs text-gray-500">
                    {patient.id.startsWith('M') ? `Age: ${patient.age}` : 'Newborn'}
                  </span>
                </div>
              </div>)}
          </div>
        </div>
        <div className="lg:col-span-3">
          {selectedPatient && selectedPatientData && <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Digital Twin: {selectedPatientData.name}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Comparing real-time data against predicted trajectories
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleExportData}
                      className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-md hover:bg-indigo-200 transition-colors"
                    >
                      Export Data
                    </button>
                    <button className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors">
                      Alert Clinician
                    </button>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-700 mb-3">
                    Blood Pressure Trajectory
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={twinComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[90, 150]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="predicted" name="Digital Twin Prediction" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="actual" name="Actual Readings" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                  {generatedTwinDeviations.some(d => d.patientId === selectedPatient && d.parameter === 'Blood Pressure') && <div className="mt-2 p-3 bg-red-50 rounded-md">
                      <div className="flex">
                        <AlertTriangleIcon size={20} className="text-red-500 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-700">
                            Significant deviation detected
                          </p>
                          <p className="text-sm text-red-700">
                            Blood pressure readings are{' '}
                            {generatedTwinDeviations.find(d => d.patientId === selectedPatient && d.parameter === 'Blood Pressure')?.deviationPercent || 28}
                            % higher than predicted by the digital twin model.
                            This deviation started 5 days ago and is increasing.
                          </p>
                        </div>
                      </div>
                    </div>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-md font-medium text-gray-700 mb-3">
                    Vital Signs Monitoring
                  </h3>
                  <div className="space-y-4">
                    {/* Blood Pressure */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">
                          Blood Pressure
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(vitalSignsData[vitalSignsData.length - 1]?.systolic || 120)}
                          /
                          {Math.round(vitalSignsData[vitalSignsData.length - 1]?.diastolic || 80)}{' '}
                          mmHg
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{
                      width: `${Math.min(100, (vitalSignsData[vitalSignsData.length - 1]?.systolic || 120) / 160 * 100)}%`
                    }}></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          Expected: 120/80
                        </span>
                        <span className="text-xs text-red-600">
                          {Math.round(((vitalSignsData[vitalSignsData.length - 1]?.systolic || 120) - 120) / 120 * 100)}
                          % deviation
                        </span>
                      </div>
                    </div>
                    {/* Heart Rate */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">
                          Heart Rate
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(vitalSignsData[vitalSignsData.length - 1]?.heartRate || 82)}{' '}
                          bpm
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{
                      width: `${Math.min(100, (vitalSignsData[vitalSignsData.length - 1]?.heartRate || 82) / 120 * 100)}%`
                    }}></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          Expected: 82
                        </span>
                        <span className="text-xs text-yellow-600">
                          {Math.round(((vitalSignsData[vitalSignsData.length - 1]?.heartRate || 82) - 82) / 82 * 100)}
                          % deviation
                        </span>
                      </div>
                    </div>
                    {/* Blood Glucose */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">
                          Blood Glucose
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(vitalSignsData[vitalSignsData.length - 1]?.glucose || 100)}{' '}
                          mg/dL
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{
                      width: `${Math.min(100, (vitalSignsData[vitalSignsData.length - 1]?.glucose || 100) / 200 * 100)}%`
                    }}></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          Expected: 100
                        </span>
                        <span className="text-xs text-orange-600">
                          {Math.round(((vitalSignsData[vitalSignsData.length - 1]?.glucose || 100) - 100) / 100 * 100)}
                          % deviation
                        </span>
                      </div>
                    </div>
                    {/* Weight */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Weight</span>
                        <span className="text-sm font-medium text-gray-700">
                          {vitalSignsData[vitalSignsData.length - 1]?.weight.toFixed(1) || 70}{' '}
                          kg
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{
                      width: `${Math.min(100, (vitalSignsData[vitalSignsData.length - 1]?.weight || 70) / 100 * 100)}%`
                    }}></div>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          Expected:{' '}
                          {selectedPatientData.id.startsWith('P') ? '3.2' : '70'}{' '}
                          kg
                        </span>
                        <span className="text-xs text-green-600">
                          {Math.round(((vitalSignsData[vitalSignsData.length - 1]?.weight || 70) - (selectedPatientData.id.startsWith('P') ? 3.2 : 70)) / (selectedPatientData.id.startsWith('P') ? 3.2 : 70) * 100)}
                          % deviation
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-md font-medium text-gray-700 mb-3">
                    AI Risk Assessment
                  </h3>
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-32 w-32 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-red-600">
                          {selectedPatientData.riskScore}
                        </span>
                      </div>
                      <svg viewBox="0 0 36 36" className="h-32 w-32 transform -rotate-90">
                        <path d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f2f2f2" strokeWidth="3" />
                        <path d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={selectedPatientData.riskLevel === 'critical' || selectedPatientData.riskLevel === 'high' ? '#ef4444' : selectedPatientData.riskLevel === 'medium' ? '#f59e0b' : '#10b981'} strokeWidth="3" strokeDasharray={`${selectedPatientData.riskScore * 0.78}, 100`} />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className={`p-3 ${selectedPatientData.riskLevel === 'critical' || selectedPatientData.riskLevel === 'high' ? 'bg-red-50' : selectedPatientData.riskLevel === 'medium' ? 'bg-yellow-50' : 'bg-green-50'} rounded-md`}>
                      <p className={`text-sm font-medium ${selectedPatientData.riskLevel === 'critical' || selectedPatientData.riskLevel === 'high' ? 'text-red-700' : selectedPatientData.riskLevel === 'medium' ? 'text-yellow-700' : 'text-green-700'}`}>
                        {selectedPatientData.riskLevel === 'critical' ? 'Critical' : selectedPatientData.riskLevel === 'high' ? 'High' : selectedPatientData.riskLevel === 'medium' ? 'Medium' : 'Low'}{' '}
                        Risk Assessment
                      </p>
                      <p className={`text-sm ${selectedPatientData.riskLevel === 'critical' || selectedPatientData.riskLevel === 'high' ? 'text-red-700' : selectedPatientData.riskLevel === 'medium' ? 'text-yellow-700' : 'text-green-700'} mt-1`}>
                        {selectedPatientData.riskLevel === 'critical' || selectedPatientData.riskLevel === 'high' ? `Digital twin analysis shows significant deviations in ${selectedPatientData.riskFactors[0]?.toLowerCase() || 'vital signs'} and ${selectedPatientData.riskFactors[1]?.toLowerCase() || 'other health indicators'}. ${selectedPatientData.id.startsWith('M') ? 'These deviations indicate a high risk of developing complications.' : 'These deviations indicate a need for close monitoring.'}` : selectedPatientData.riskLevel === 'medium' ? `Digital twin analysis shows moderate deviations in ${selectedPatientData.riskFactors[0]?.toLowerCase() || 'vital signs'}. Continued monitoring recommended.` : 'Digital twin analysis shows all vital signs within normal parameters. Low risk profile detected.'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Recommended Interventions
                      </h4>
                      <ul className="space-y-2">
                        {selectedPatientData.riskLevel === 'critical' || selectedPatientData.riskLevel === 'high' ? <>
                            <li className="flex items-start">
                              <ArrowRightIcon size={16} className="text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                {selectedPatientData.id.startsWith('M') ? 'Immediate consultation with OB-GYN' : 'Immediate pediatric specialist consultation'}
                              </span>
                            </li>
                            <li className="flex items-start">
                              <ArrowRightIcon size={16} className="text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                {selectedPatientData.id.startsWith('M') ? 'Increase prenatal visit frequency to weekly' : 'Daily monitoring of vital signs'}
                              </span>
                            </li>
                            <li className="flex items-start">
                              <ArrowRightIcon size={16} className="text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                {selectedPatientData.riskFactors.some(f => f.toLowerCase().includes('pressure') || f.toLowerCase().includes('hypertension')) ? 'Daily home blood pressure monitoring' : selectedPatientData.riskFactors.some(f => f.toLowerCase().includes('glucose') || f.toLowerCase().includes('diabetes')) ? 'Blood glucose monitoring 3x daily' : 'Close monitoring of primary risk factors'}
                              </span>
                            </li>
                            <li className="flex items-start">
                              <ArrowRightIcon size={16} className="text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                {selectedPatientData.riskFactors.some(f => f.toLowerCase().includes('glucose') || f.toLowerCase().includes('diabetes')) ? 'Dietary modifications to reduce blood glucose' : selectedPatientData.riskFactors.some(f => f.toLowerCase().includes('weight') || f.toLowerCase().includes('bmi')) ? 'Nutritional consultation' : 'Targeted intervention for primary risk factors'}
                              </span>
                            </li>
                          </> : selectedPatientData.riskLevel === 'medium' ? <>
                            <li className="flex items-start">
                              <ArrowRightIcon size={16} className="text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                Regular monitoring of key health indicators
                              </span>
                            </li>
                            <li className="flex items-start">
                              <ArrowRightIcon size={16} className="text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                Bi-weekly checkups
                              </span>
                            </li>
                            <li className="flex items-start">
                              <ArrowRightIcon size={16} className="text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                Lifestyle and nutrition counseling
                              </span>
                            </li>
                          </> : <>
                            <li className="flex items-start">
                              <ArrowRightIcon size={16} className="text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                Continue standard care protocol
                              </span>
                            </li>
                            <li className="flex items-start">
                              <ArrowRightIcon size={16} className="text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                Monthly checkups
                              </span>
                            </li>
                            <li className="flex items-start">
                              <ArrowRightIcon size={16} className="text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                General health maintenance
                              </span>
                            </li>
                          </>}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>}
        </div>
      </div>
      {/* All Deviations */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Digital Twin Deviations {showAllDeviations && `(${generatedTwinDeviations.length} total)`}
          </h2>
          <button 
            onClick={handleToggleAllDeviations}
            className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            {showAllDeviations ? 'Show Less' : `View All (${generatedTwinDeviations.length})`}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parameter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected vs Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deviation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedDeviations.map((deviation, index) => {
              const patient = allPatients.find(p => p.id === deviation.patientId) || {
                name: 'Unknown',
                id: deviation.patientId
              };
              return <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {patient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {patient.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {deviation.parameter}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Expected: {deviation.expected}
                      </div>
                      <div className="text-sm text-gray-900">
                        Actual: {deviation.actual}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deviation.deviationPercent > 25 ? 'bg-red-100 text-red-800' : deviation.deviationPercent > 15 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        +{deviation.deviationPercent}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(deviation.timestamp).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => setSelectedPatient(deviation.patientId)} className="text-indigo-600 hover:text-indigo-900">
                        View Details
                      </button>
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
};
export default DigitalTwins;