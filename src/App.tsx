import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DataIngestion from './pages/DataIngestion';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import DigitalTwins from './pages/DigitalTwins';
import PolicySimulation from './pages/PolicySimulation';
import ResourceAllocation from './pages/ResourceAllocation';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Layout from './components/Layout/Layout';
import { DataProvider, useData } from './context/DataContext';
// Protected route wrapper
const ProtectedRoute = ({
  children
}: {
  children: JSX.Element;
}) => {
  const {
    isAuthenticated
  } = useData();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{
      from: location
    }} replace />;
  }
  return children;
};
// Main routes component that uses the auth context
const AppRoutes = () => {
  const {
    isAuthenticated
  } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  // Redirect to dashboard if logged in and trying to access login page
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/login') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, location.pathname]);
  return <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>} />
      <Route path="/data-ingestion" element={<ProtectedRoute>
            <Layout>
              <DataIngestion />
            </Layout>
          </ProtectedRoute>} />
      <Route path="/predictive-analytics" element={<ProtectedRoute>
            <Layout>
              <PredictiveAnalytics />
            </Layout>
          </ProtectedRoute>} />
      <Route path="/digital-twins" element={<ProtectedRoute>
            <Layout>
              <DigitalTwins />
            </Layout>
          </ProtectedRoute>} />
      <Route path="/policy-simulation" element={<ProtectedRoute>
            <Layout>
              <PolicySimulation />
            </Layout>
          </ProtectedRoute>} />
      <Route path="/resource-allocation" element={<ProtectedRoute>
            <Layout>
              <ResourceAllocation />
            </Layout>
          </ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>;
};
export function App() {
  return <DataProvider>
      <Router>
        <AppRoutes />
      </Router>
    </DataProvider>;
}