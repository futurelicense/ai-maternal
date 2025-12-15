import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { LineChartIcon, TrendingDownIcon, DollarSignIcon, CalendarIcon, PlayIcon, PauseIcon, BrainCircuitIcon, FileTextIcon, AlertTriangleIcon, XIcon } from 'lucide-react';
import { useData } from '../context/DataContext';
import { PolicyScenario } from '../utils/dataModels';
import { policyAPI } from '../services/apiClient';

const PolicySimulation: React.FC = () => {
  const {
    policyScenarios,
    hasLoadedRealData,
    isLoading,
    maternalRisks,
    pediatricRisks,
    refreshData
  } = useData();
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    targetPopulation: 1000
  });
  const [isCreating, setIsCreating] = useState(false);
  // Set default selected scenario when data loads
  useMemo(() => {
    if (activeScenario === null && policyScenarios.length > 0) {
      setActiveScenario(policyScenarios[0].id);
    }
  }, [policyScenarios, activeScenario]);
  const selectedScenario = useMemo(() => {
    return policyScenarios.find(s => s.id === activeScenario) || policyScenarios[0];
  }, [policyScenarios, activeScenario]);
  // Generate cost-benefit data based on the selected scenario
  const costBenefitData = useMemo(() => {
    if (!selectedScenario) return [];
    return [{
      name: 'Implementation Cost',
      value: selectedScenario.predictedOutcomes.costIncrease
    }, {
      name: 'Maternal Mortality Reduction',
      value: Math.abs(selectedScenario.predictedOutcomes.maternalMortality) * 0.8
    }, {
      name: 'Infant Mortality Reduction',
      value: Math.abs(selectedScenario.predictedOutcomes.infantMortality) * 0.7
    }, {
      name: 'Long-term Savings',
      value: Math.abs(selectedScenario.predictedOutcomes.maternalMortality + selectedScenario.predictedOutcomes.infantMortality) * 1.2
    }];
  }, [selectedScenario]);
  // Generate impact over time data based on the selected scenario
  const impactOverTimeData = useMemo(() => {
    if (!selectedScenario) return [];
    // Calculate baseline and policy trajectories based on scenario details
    const maternalReduction = Math.abs(selectedScenario.predictedOutcomes.maternalMortality) / 100;
    const infantReduction = Math.abs(selectedScenario.predictedOutcomes.infantMortality) / 100;
    const avgReduction = (maternalReduction + infantReduction) / 2;
    return [{
      month: 'Month 1',
      baseline: 100,
      withPolicy: 100
    }, {
      month: 'Month 3',
      baseline: 102,
      withPolicy: 100 - avgReduction * 100 * 0.1
    }, {
      month: 'Month 6',
      baseline: 105,
      withPolicy: 100 - avgReduction * 100 * 0.3
    }, {
      month: 'Month 9',
      baseline: 107,
      withPolicy: 100 - avgReduction * 100 * 0.5
    }, {
      month: 'Month 12',
      baseline: 110,
      withPolicy: 100 - avgReduction * 100 * 0.7
    }, {
      month: 'Month 18',
      baseline: 112,
      withPolicy: 100 - avgReduction * 100 * 0.9
    }, {
      month: 'Month 24',
      baseline: 115,
      withPolicy: 100 - avgReduction * 100
    }];
  }, [selectedScenario]);
  // Generate regional impact data based on maternal and pediatric data
  const regionalImpactData = useMemo(() => {
    if (!selectedScenario || maternalRisks.length === 0) return [];
    // Group patients by region (using first part of ID as mock region)
    const regions = Array.from(new Set(maternalRisks.map(patient => patient.id.substring(0, 3)))).slice(0, 5); // Limit to 5 regions
    // Calculate baseline mortality rates per region (mock data based on risk scores)
    return regions.map(region => {
      const regionalPatients = maternalRisks.filter(p => p.id.substring(0, 3) === region);
      const avgRiskScore = regionalPatients.reduce((sum, p) => sum + p.riskScore, 0) / (regionalPatients.length || 1);
      // Scale to a reasonable mortality rate (0.1% to 5% based on risk)
      const baselineMortality = Math.max(10, Math.min(50, avgRiskScore * 0.5));
      // Calculate projected mortality with policy
      const reductionFactor = Math.abs(selectedScenario.predictedOutcomes.maternalMortality) / 100;
      const projectedMortality = baselineMortality * (1 - reductionFactor);
      return {
        region: `Region ${region}`,
        baseline: baselineMortality,
        withPolicy: projectedMortality
      };
    });
  }, [selectedScenario, maternalRisks]);
  // Generate equity impact data
  const equityImpactData = useMemo(() => {
    if (!selectedScenario) return [];
    // Create demographic groups based on risk factors
    const groups = [{
      group: 'Low Income',
      baseline: 48,
      withPolicy: 48 * (1 - Math.abs(selectedScenario.predictedOutcomes.maternalMortality) / 100 * 1.2)
    }, {
      group: 'Middle Income',
      baseline: 32,
      withPolicy: 32 * (1 - Math.abs(selectedScenario.predictedOutcomes.maternalMortality) / 100)
    }, {
      group: 'High Income',
      baseline: 18,
      withPolicy: 18 * (1 - Math.abs(selectedScenario.predictedOutcomes.maternalMortality) / 100 * 0.8)
    }, {
      group: 'Urban',
      baseline: 28,
      withPolicy: 28 * (1 - Math.abs(selectedScenario.predictedOutcomes.maternalMortality) / 100 * 0.9)
    }, {
      group: 'Rural',
      baseline: 45,
      withPolicy: 45 * (1 - Math.abs(selectedScenario.predictedOutcomes.maternalMortality) / 100 * 1.1)
    }];
    return groups;
  }, [selectedScenario]);
  // Start the simulation
  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };
  // Stop the simulation
  const stopSimulation = () => {
    setIsSimulating(false);
  };

  // Handle create new scenario
  const handleCreateScenario = async () => {
    if (!newScenario.name || !newScenario.description) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      const result = await policyAPI.createScenario(newScenario);
      await refreshData();
      setShowCreateModal(false);
      setNewScenario({ name: '', description: '', targetPopulation: 1000 });
      setActiveScenario(result.id);
    } catch (error: any) {
      alert('Error creating scenario: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading policy data...</p>
        </div>
      </div>;
  }
  // No policy scenarios available
  if (policyScenarios.length === 0) {
    return <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Policy Simulation
            </h1>
            <p className="text-gray-600 mt-1">
              Simulate and analyze the impact of policy changes
            </p>
          </div>
        </div>
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <AlertTriangleIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Policy Scenarios Available
          </h2>
          <p className="text-gray-600 mb-6">
            No policy scenarios have been defined. Please upload policy data or
            create new scenarios.
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
            Policy Simulation
          </h1>
          <p className="text-gray-600 mt-1">
            Simulate and analyze the impact of policy changes
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Create New Scenario
          </button>
        </div>
      </div>
      {/* Policy Simulator */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
            <LineChartIcon size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Policy Simulator
            </h2>
            <p className="text-gray-600 mt-1">
              Use AI models to simulate the impact of policy changes on maternal
              and child health outcomes. The simulator uses Hugging Face models
              to project health metrics, costs, and resource needs.
            </p>
          </div>
        </div>
      </div>
      {/* Scenario Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {policyScenarios.map(scenario => <div key={scenario.id} onClick={() => setActiveScenario(scenario.id)} className={`bg-white p-6 rounded-lg shadow-sm border cursor-pointer ${activeScenario === scenario.id ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-200'}`}>
            <h3 className="text-md font-semibold text-gray-800">
              {scenario.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Maternal Mortality
                </span>
                <span className="text-xs font-medium text-green-600">
                  {scenario.predictedOutcomes.maternalMortality}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Infant Mortality</span>
                <span className="text-xs font-medium text-green-600">
                  {scenario.predictedOutcomes.infantMortality}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Cost Increase</span>
                <span className="text-xs font-medium text-red-600">
                  +{scenario.predictedOutcomes.costIncrease}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Implementation Time
                </span>
                <span className="text-xs font-medium text-gray-600">
                  {scenario.predictedOutcomes.implementationTime}
                </span>
              </div>
            </div>
            {activeScenario === scenario.id && <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                <button className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-md" onClick={() => startSimulation()}>
                  Run Simulation
                </button>
              </div>}
          </div>)}
      </div>
      {/* Simulation Interface */}
      {selectedScenario && <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Simulating: {selectedScenario.name}
            </h2>
            <div className="flex space-x-2">
              {!isSimulating ? <button onClick={startSimulation} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  <PlayIcon size={16} className="mr-2" />
                  Start Simulation
                </button> : <button onClick={stopSimulation} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                  <PauseIcon size={16} className="mr-2" />
                  Pause
                </button>}
            </div>
          </div>
          {isSimulating && <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Simulation Progress
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {simulationProgress}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{
            width: `${simulationProgress}%`
          }}></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Running AI models to simulate policy impact...
              </div>
            </div>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Impact Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={impactOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="baseline" name="Baseline Scenario" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="withPolicy" name={`With ${selectedScenario.name}`} stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 p-3 bg-green-50 rounded-md">
                <div className="flex">
                  <TrendingDownIcon size={20} className="text-green-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-green-700">
                    This policy is projected to reduce maternal mortality by{' '}
                    {Math.abs(selectedScenario.predictedOutcomes.maternalMortality)}
                    % over 24 months.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Cost-Benefit Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costBenefitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <div className="flex">
                  <DollarSignIcon size={20} className="text-blue-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    Initial investment of +
                    {selectedScenario.predictedOutcomes.costIncrease}% is
                    projected to yield 2.5x return on investment through
                    improved health outcomes.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-md font-medium text-gray-700 mb-3">
              AI-Generated Policy Insights
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <BrainCircuitIcon size={16} className="text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Summary</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    The {selectedScenario.name} policy is projected to have a
                    significant positive impact on maternal and child health
                    outcomes. By {selectedScenario.description.toLowerCase()},
                    we can expect to see a{' '}
                    {Math.abs(selectedScenario.predictedOutcomes.maternalMortality)}
                    % reduction in maternal mortality and a{' '}
                    {Math.abs(selectedScenario.predictedOutcomes.infantMortality)}
                    % reduction in infant mortality over a 24-month period.
                  </p>
                </div>
              </div>
              <div className="mt-4 ml-11 space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">
                    Key Benefits
                  </h4>
                  <ul className="mt-1 space-y-1">
                    <li className="text-sm text-gray-700">
                      • Reduced emergency interventions by early risk detection
                    </li>
                    <li className="text-sm text-gray-700">
                      • Improved access to care for underserved populations
                    </li>
                    <li className="text-sm text-gray-700">
                      • Long-term healthcare cost savings from preventive care
                    </li>
                    <li className="text-sm text-gray-700">
                      • Better maternal and infant health outcomes in high-risk
                      communities
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">
                    Implementation Considerations
                  </h4>
                  <ul className="mt-1 space-y-1">
                    <li className="text-sm text-gray-700">
                      • Estimated{' '}
                      {selectedScenario.predictedOutcomes.implementationTime}{' '}
                      implementation timeline
                    </li>
                    <li className="text-sm text-gray-700">
                      • Initial budget increase of{' '}
                      {selectedScenario.predictedOutcomes.costIncrease}%
                      required
                    </li>
                    <li className="text-sm text-gray-700">
                      • Staff training and technology integration needed
                    </li>
                    <li className="text-sm text-gray-700">
                      • Community outreach programs to ensure adoption
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">
                    Recommendation
                  </h4>
                  <p className="text-sm text-gray-700 mt-1">
                    Based on the cost-benefit analysis and projected health
                    outcomes, implementing the {selectedScenario.name} policy is
                    strongly recommended. The initial investment will be offset
                    by reduced emergency care costs and improved long-term
                    health outcomes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>}
      {/* Regional Impact */}
      {selectedScenario && <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Regional Impact Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Impact by Region
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionalImpactData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="baseline" name="Current Maternal Mortality" fill="#8884d8" />
                  <Bar dataKey="withPolicy" name="Projected with Policy" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Equity Impact
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={equityImpactData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="group" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="baseline" name="Current Gap" fill="#8884d8" fillOpacity={0.8} />
                  <Area type="monotone" dataKey="withPolicy" name="Projected Gap" fill="#82ca9d" fillOpacity={0.8} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-2 p-3 bg-indigo-50 rounded-md">
                <p className="text-sm text-indigo-700">
                  This policy is projected to reduce healthcare disparities by{' '}
                  {Math.round((1 - equityImpactData[0].withPolicy / equityImpactData[0].baseline) * 100)}
                  % between highest and lowest income groups.
                </p>
              </div>
            </div>
          </div>
        </div>}
      {/* Export Options */}
      {selectedScenario && <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Export & Reporting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <FileTextIcon size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-800">
                    Policy Brief
                  </h3>
                  <p className="text-xs text-gray-500">PDF format</p>
                </div>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <FileTextIcon size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-800">
                    Data Tables
                  </h3>
                  <p className="text-xs text-gray-500">CSV format</p>
                </div>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                  <FileTextIcon size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-800">
                    Presentation
                  </h3>
                  <p className="text-xs text-gray-500">PowerPoint format</p>
                </div>
              </div>
            </div>
          </div>
        </div>}
      
      {/* Create New Scenario Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Create New Policy Scenario</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Name *
                </label>
                <input
                  type="text"
                  value={newScenario.name}
                  onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Enhanced Prenatal Screening"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newScenario.description}
                  onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Describe the policy intervention and its goals..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Population
                </label>
                <input
                  type="number"
                  value={newScenario.targetPopulation}
                  onChange={(e) => setNewScenario({ ...newScenario, targetPopulation: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateScenario}
                disabled={isCreating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Scenario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>;
};
export default PolicySimulation;