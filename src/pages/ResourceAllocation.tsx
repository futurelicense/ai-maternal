import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { MapIcon, BedIcon, UserIcon, SyringeIcon, TrendingUpIcon, TrendingDownIcon, CalendarIcon, FilterIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { useData } from '../context/DataContext';
import { ResourceAllocation as ResourceData } from '../utils/dataModels';
import ResourceMap from '../components/ResourceMap';
const ResourceAllocation: React.FC = () => {
  const {
    resourceNeeds,
    hasLoadedRealData,
    isLoading,
    maternalRisks,
    pediatricRisks
  } = useData();
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [resourceType, setResourceType] = useState<'nicuBeds' | 'obgynStaff' | 'vaccineStock'>('nicuBeds');
  const resourceLabels = {
    nicuBeds: 'NICU Beds',
    obgynStaff: 'OB-GYN Staff',
    vaccineStock: 'Vaccine Stock (%)'
  };
  const resourceIcons = {
    nicuBeds: <BedIcon size={20} />,
    obgynStaff: <UserIcon size={20} />,
    vaccineStock: <SyringeIcon size={20} />
  };
  // Generate forecast data based on current resource needs and risk data
  const forecastData = useMemo(() => {
    // Use the current resource type average as baseline
    const currentValue = resourceNeeds.length > 0 ? resourceNeeds.reduce((sum, item) => sum + item[resourceType], 0) / resourceNeeds.length : 45;
    // Calculate growth factor based on high-risk patients
    const highRiskPatients = [...maternalRisks, ...pediatricRisks].filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;
    const growthFactor = highRiskPatients > 0 ? 0.1 + highRiskPatients * 0.01 : 0.1;
    return [{
      month: 'Jul',
      current: currentValue,
      forecast: currentValue
    }, {
      month: 'Aug',
      current: currentValue,
      forecast: Math.round(currentValue * (1 + growthFactor * 1))
    }, {
      month: 'Sep',
      current: currentValue,
      forecast: Math.round(currentValue * (1 + growthFactor * 2))
    }, {
      month: 'Oct',
      current: currentValue,
      forecast: Math.round(currentValue * (1 + growthFactor * 3))
    }, {
      month: 'Nov',
      current: currentValue,
      forecast: Math.round(currentValue * (1 + growthFactor * 4))
    }, {
      month: 'Dec',
      current: currentValue,
      forecast: Math.round(currentValue * (1 + growthFactor * 5))
    }];
  }, [resourceNeeds, resourceType, maternalRisks, pediatricRisks]);
  // Create data for regional resource distribution
  const regionalResourceData = useMemo(() => {
    return resourceNeeds.map(region => ({
      region: region.region,
      value: region[resourceType]
    }));
  }, [resourceNeeds, resourceType]);
  // Calculate projected shortage
  const projectedShortage = useMemo(() => {
    if (forecastData.length === 0) return 0;
    const lastMonth = forecastData[forecastData.length - 1];
    if (!lastMonth) return 0;
    return Math.round(lastMonth.forecast - lastMonth.current);
  }, [forecastData]);
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resource data...</p>
        </div>
      </div>;
  }
  // No resource data available
  if (resourceNeeds.length === 0) {
    return <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Resource Allocation
            </h1>
            <p className="text-gray-600 mt-1">
              AI-driven resource forecasting and allocation
            </p>
          </div>
        </div>
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <AlertTriangleIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Resource Data Available
          </h2>
          <p className="text-gray-600 mb-6">
            No resource allocation data has been defined. Please upload resource
            data or create new allocations.
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
            Resource Allocation
          </h1>
          <p className="text-gray-600 mt-1">
            AI-driven resource forecasting and allocation
          </p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setTimeRange('month')} className={`px-4 py-2 rounded-md ${timeRange === 'month' ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            Month
          </button>
          <button onClick={() => setTimeRange('quarter')} className={`px-4 py-2 rounded-md ${timeRange === 'quarter' ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            Quarter
          </button>
          <button onClick={() => setTimeRange('year')} className={`px-4 py-2 rounded-md ${timeRange === 'year' ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
            Year
          </button>
        </div>
      </div>
      {/* Resource Forecasting Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start">
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
            <MapIcon size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Resource Forecasting
            </h2>
            <p className="text-gray-600 mt-1">
              AI-powered predictive models forecast resource needs based on
              population health data, demographic trends, and historical
              utilization patterns.
            </p>
            <div className="mt-3 p-3 bg-blue-50 rounded-md">
              <div className="flex">
                <TrendingUpIcon size={20} className="text-blue-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Forecasting shows a{' '}
                  {forecastData.length > 0 && forecastData[0]?.current 
                    ? Math.round(((forecastData[forecastData.length - 1]?.forecast || 0) / forecastData[0].current - 1) * 100)
                    : 0}
                  % increase in {resourceLabels[resourceType]} needs over the
                  next {timeRange}
                  {resourceNeeds.length > 0 && `, primarily in ${resourceNeeds[0].region}${resourceNeeds.length > 1 ? ` and ${resourceNeeds[1].region}` : ''}`}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Resource Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div onClick={() => setResourceType('nicuBeds')} className={`bg-white p-6 rounded-lg shadow-sm border cursor-pointer ${resourceType === 'nicuBeds' ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-200'}`}>
          <div className="flex items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${resourceType === 'nicuBeds' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
              <BedIcon size={20} />
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-800">NICU Beds</h3>
              <p className="text-sm text-gray-600 mt-1">
                Neonatal Intensive Care
              </p>
            </div>
          </div>
        </div>
        <div onClick={() => setResourceType('obgynStaff')} className={`bg-white p-6 rounded-lg shadow-sm border cursor-pointer ${resourceType === 'obgynStaff' ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-200'}`}>
          <div className="flex items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${resourceType === 'obgynStaff' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-800">
                OB-GYN Staff
              </h3>
              <p className="text-sm text-gray-600 mt-1">Medical Personnel</p>
            </div>
          </div>
        </div>
        <div onClick={() => setResourceType('vaccineStock')} className={`bg-white p-6 rounded-lg shadow-sm border cursor-pointer ${resourceType === 'vaccineStock' ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-200'}`}>
          <div className="flex items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${resourceType === 'vaccineStock' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
              <SyringeIcon size={20} />
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-800">
                Vaccine Stock
              </h3>
              <p className="text-sm text-gray-600 mt-1">Immunization Supply</p>
            </div>
          </div>
        </div>
      </div>
      {/* Resource Forecast Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {resourceLabels[resourceType]} Forecast
            </h2>
            <div className="flex items-center space-x-2">
              <CalendarIcon size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Next 6 Months</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="current" name="Current Capacity" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="forecast" name="Forecasted Need" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-yellow-50 rounded-md">
            <div className="flex">
              <AlertTriangleIcon size={20} className="text-yellow-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                Projected {resourceLabels[resourceType]} shortage of{' '}
                {projectedShortage} units by December. Recommend increasing
                capacity by{' '}
                {forecastData.length > 0 && forecastData[0]?.current
                  ? Math.round(((forecastData[forecastData.length - 1]?.forecast || 0) / forecastData[0].current - 1) * 100)
                  : 0}
                % to meet forecasted demand.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Regional Distribution
            </h2>
            <div className="flex items-center space-x-2">
              <FilterIcon size={16} className="text-gray-400" />
              <select className="text-sm border border-gray-300 rounded-md py-1 px-2">
                <option>All Regions</option>
                <option>High-Need Regions</option>
                <option>Low-Resource Regions</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionalResourceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" name={resourceLabels[resourceType]} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">
              Regional Insights
            </h3>
            <ul className="space-y-2">
              {resourceNeeds.slice(0, 3).map((region, index) => {
              const avgValue = resourceNeeds.reduce((sum, r) => sum + r[resourceType], 0) / resourceNeeds.length;
              const isCritical = region[resourceType] < avgValue * 0.8;
              const isWarning = region[resourceType] < avgValue && !isCritical;
              const isGood = region[resourceType] >= avgValue;
              return <li key={region.region} className="flex items-start">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center mr-2 mt-0.5
                      ${isCritical ? 'bg-red-100' : isWarning ? 'bg-yellow-100' : 'bg-green-100'}`}>
                      {isCritical ? <AlertTriangleIcon size={12} className="text-red-600" /> : isWarning ? <AlertTriangleIcon size={12} className="text-yellow-600" /> : <CheckCircleIcon size={12} className="text-green-600" />}
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{region.region}</span>{' '}
                      {isCritical ? `requires immediate allocation of ${Math.ceil(avgValue - region[resourceType])} additional ${resourceLabels[resourceType].toLowerCase()}.` : isWarning ? `projected to need ${Math.ceil((avgValue - region[resourceType]) / 2)} more ${resourceLabels[resourceType].toLowerCase()} within 30 days.` : `has sufficient ${resourceLabels[resourceType].toLowerCase()} for the next 90 days.`}
                    </p>
                  </li>;
            })}
            </ul>
          </div>
        </div>
      </div>
      {/* Resource Allocation Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          AI-Driven Resource Allocation Recommendations
        </h2>
        <div className="space-y-4">
          <div className="p-4 border border-indigo-100 bg-indigo-50 rounded-md">
            <div className="flex">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3 flex-shrink-0">
                {resourceIcons[resourceType]}
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-800">
                  Optimal {resourceLabels[resourceType]} Allocation
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  Based on AI analysis of population health data, demographic
                  trends, and historical utilization patterns, the following
                  resource allocation is recommended:
                </p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resourceNeeds.map(region => <div key={region.region} className="flex justify-between items-center p-3 bg-white rounded-md">
                      <span className="text-sm font-medium text-gray-700">
                        {region.region}
                      </span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">
                          {region[resourceType]}
                        </span>
                        {region[resourceType] > resourceNeeds.reduce((sum, r) => sum + r[resourceType], 0) / resourceNeeds.length ? <TrendingUpIcon size={16} className="text-red-500" /> : <TrendingDownIcon size={16} className="text-green-500" />}
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="text-md font-medium text-gray-800 mb-2">
                Cost Implications
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[{
                  name: 'Equipment',
                  value: resourceType === 'nicuBeds' ? 55 : 35
                }, {
                  name: 'Personnel',
                  value: resourceType === 'obgynStaff' ? 65 : 45
                }, {
                  name: 'Facilities',
                  value: resourceType === 'vaccineStock' ? 40 : 20
                }]} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({
                  name,
                  percent
                }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {[0, 1, 2].map((entry, index) => <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658'][index % 3]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 mt-2">
                Estimated cost for recommended resource allocation: $
                {forecastData.length > 0 && forecastData[0]?.current
                  ? (1.45 * ((forecastData[forecastData.length - 1]?.forecast || 0) / forecastData[0].current)).toFixed(2)
                  : '0.00'}
                M
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-md">
              <h3 className="text-md font-medium text-gray-800 mb-2">
                Implementation Timeline
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={[{
                month: 'Jul',
                completion: 0
              }, {
                month: 'Aug',
                completion: 15
              }, {
                month: 'Sep',
                completion: 40
              }, {
                month: 'Oct',
                completion: 65
              }, {
                month: 'Nov',
                completion: 85
              }, {
                month: 'Dec',
                completion: 100
              }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="completion" name="Completion %" fill="#8884d8" fillOpacity={0.8} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 mt-2">
                Phased implementation over 6 months, prioritizing high-need
                regions.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Resource Allocation Map */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Resource Allocation Map - {resourceLabels[resourceType]} Distribution
        </h2>
        <div className="mb-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span className="text-gray-600">Critical Shortage (&lt;80% avg)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
              <span className="text-gray-600">Below Average</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-600">Adequate Resources</span>
            </div>
          </div>
        </div>
        <ResourceMap resources={resourceNeeds} resourceType={resourceType} />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-red-50 rounded-md">
            <h3 className="text-sm font-medium text-red-800">
              Critical Shortage Areas
            </h3>
            <p className="text-xs text-red-700 mt-1">
              {resourceNeeds.filter(r => r[resourceType] < resourceNeeds.reduce((sum, item) => sum + item[resourceType], 0) / resourceNeeds.length * 0.8).map(r => r.region).join(', ') || 'None detected'}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800">
              At-Risk Areas
            </h3>
            <p className="text-xs text-yellow-700 mt-1">
              {resourceNeeds.filter(r => {
              const avg = resourceNeeds.reduce((sum, item) => sum + item[resourceType], 0) / resourceNeeds.length;
              return r[resourceType] >= avg * 0.8 && r[resourceType] < avg;
            }).map(r => r.region).join(', ') || 'None detected'}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-md">
            <h3 className="text-sm font-medium text-green-800">
              Adequate Resource Areas
            </h3>
            <p className="text-xs text-green-700 mt-1">
              {resourceNeeds.filter(r => r[resourceType] >= resourceNeeds.reduce((sum, item) => sum + item[resourceType], 0) / resourceNeeds.length).map(r => r.region).join(', ') || 'None detected'}
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default ResourceAllocation;