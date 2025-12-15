import React, { useMemo, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { ResourceAllocation } from '../utils/dataModels';

interface ResourceMapProps {
  resources: ResourceAllocation[];
  resourceType: 'nicuBeds' | 'obgynStaff' | 'vaccineStock';
}

const ResourceMap: React.FC<ResourceMapProps> = ({ resources, resourceType }) => {
  const [selectedRegion, setSelectedRegion] = React.useState<ResourceAllocation | null>(null);

  const mapContainerStyle = {
    width: '100%',
    height: '384px',
  };

  // Default center (United States)
  const center = {
    lat: 39.8283,
    lng: -98.5795,
  };

  // Regional coordinates mapping
  const regionCoordinates: Record<string, { lat: number; lng: number }> = {
    'North County': { lat: 40.7128, lng: -74.0060 },
    'Central District': { lat: 39.8283, lng: -98.5795 },
    'South County': { lat: 34.0522, lng: -118.2437 },
    'East Region': { lat: 42.3601, lng: -71.0589 },
    'West Region': { lat: 37.7749, lng: -122.4194 },
  };

  // Calculate average value for comparison
  const averageValue = useMemo(() => {
    if (resources.length === 0) return 0;
    const sum = resources.reduce((acc, r) => {
      const value = resourceType === 'nicuBeds' ? r.nicuBeds : 
                    resourceType === 'obgynStaff' ? r.obgynStaff : 
                    r.vaccineStock;
      return acc + value;
    }, 0);
    return sum / resources.length;
  }, [resources, resourceType]);

  // Determine marker color based on resource level
  const getMarkerColor = useCallback((resource: ResourceAllocation): string => {
    const value = resourceType === 'nicuBeds' ? resource.nicuBeds : 
                  resourceType === 'obgynStaff' ? resource.obgynStaff : 
                  resource.vaccineStock;
    
    if (value < averageValue * 0.8) return '#ef4444'; // Red - Critical
    if (value < averageValue) return '#f59e0b'; // Orange - Warning
    return '#22c55e'; // Green - Good
  }, [averageValue, resourceType]);

  const getStatusText = useCallback((resource: ResourceAllocation): string => {
    const value = resourceType === 'nicuBeds' ? resource.nicuBeds : 
                  resourceType === 'obgynStaff' ? resource.obgynStaff : 
                  resource.vaccineStock;
    
    if (value < averageValue * 0.8) return 'Critical Shortage';
    if (value < averageValue) return 'Below Average';
    return 'Adequate Resources';
  }, [averageValue, resourceType]);

  const resourceLabels = {
    nicuBeds: 'NICU Beds',
    obgynStaff: 'OB-GYN Staff',
    vaccineStock: 'Vaccine Stock (%)',
  };

  // Create SVG marker
  const createMarkerIcon = (color: string) => {
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="3"/>
      </svg>`
    )}`;
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Fallback visualization without Google Maps
  if (!apiKey) {
    return (
      <div className="h-96 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
          {resources.map((resource) => {
            const color = getMarkerColor(resource);
            const status = getStatusText(resource);
            const value = resourceType === 'nicuBeds' ? resource.nicuBeds : 
                         resourceType === 'obgynStaff' ? resource.obgynStaff : 
                         resource.vaccineStock;
            
            return (
              <div 
                key={resource.region}
                className="bg-white rounded-lg p-4 shadow-sm border-2 hover:shadow-md transition-shadow"
                style={{ borderColor: color }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{resource.region}</h3>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span 
                      className="font-medium"
                      style={{ color: color }}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{resourceLabels[resourceType]}:</span>
                    <span className="font-semibold text-gray-900">{value}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">NICU Beds:</span>
                      <span className="text-gray-700">{resource.nicuBeds}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">OB-GYN Staff:</span>
                      <span className="text-gray-700">{resource.obgynStaff}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Vaccine Stock:</span>
                      <span className="text-gray-700">{resource.vaccineStock}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            💡 Add VITE_GOOGLE_MAPS_API_KEY to enable interactive map view
          </p>
        </div>
      </div>
    );
  }

  // Try to render Google Maps with error boundary
  try {
    return (
      <LoadScript 
        googleMapsApiKey={apiKey}
        onError={(error) => {
          console.error('Google Maps failed to load:', error);
        }}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={4}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {resources.map((resource) => {
            const coords = regionCoordinates[resource.region] || center;

            return (
              <Marker
                key={resource.region}
                position={coords}
                onClick={() => setSelectedRegion(resource)}
                icon={{
                  url: createMarkerIcon(getMarkerColor(resource)),
                  scaledSize: { width: 32, height: 32 } as any,
                }}
              />
            );
          })}

          {selectedRegion && (
            <InfoWindow
              position={regionCoordinates[selectedRegion.region] || center}
              onCloseClick={() => setSelectedRegion(null)}
            >
              <div className="p-2">
                <h3 className="font-semibold text-gray-900 mb-2">{selectedRegion.region}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      getMarkerColor(selectedRegion) === '#ef4444' ? 'text-red-600' :
                      getMarkerColor(selectedRegion) === '#f59e0b' ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {getStatusText(selectedRegion)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">{resourceLabels[resourceType]}:</span>
                    <span className="font-medium text-gray-900">
                      {resourceType === 'nicuBeds' ? selectedRegion.nicuBeds : 
                       resourceType === 'obgynStaff' ? selectedRegion.obgynStaff : 
                       selectedRegion.vaccineStock}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">NICU Beds:</span>
                    <span className="text-gray-900">{selectedRegion.nicuBeds}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">OB-GYN Staff:</span>
                    <span className="text-gray-900">{selectedRegion.obgynStaff}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">Vaccine Stock:</span>
                    <span className="text-gray-900">{selectedRegion.vaccineStock}%</span>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    );
  } catch (error) {
    console.error('Error rendering ResourceMap:', error);
    // Return fallback if Google Maps fails
    return (
      <div className="h-96 bg-gray-100 rounded-md flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">Unable to load map visualization</p>
          <p className="text-gray-500 text-sm mt-1">
            Showing data in list view instead
          </p>
        </div>
      </div>
    );
  }
};

export default ResourceMap;
