import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import VotingPage from './pages/VotingPage';
import Maintenance from './pages/Maintenance';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, loading, token } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/" />;
  if (requireAdmin && !user?.isAdmin) return <Navigate to="/dashboard" />;
  return children;
};

export default function App() {
  return (
    <RouterWrapped />
  );
}

function RouterWrapped() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vote"
            element={
              <ProtectedRoute>
                <VotingPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
