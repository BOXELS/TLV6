import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadFiles from './pages/UploadFiles';
import BulkUpload from './pages/BulkUpload';
import DtfPrintHistory from './pages/DtfPrintHistory';
import SsaOrders from './pages/SsaOrders';
import SsaOrderHistory from './pages/SsaOrderHistory';
import Categories from './pages/Categories';
import Keywords from './pages/Keywords';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Shipstation from './pages/Shipstation';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useAdmin } from './hooks/useAdmin';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { isAdmin, loading } = useAdmin();

  if (!session) return <Navigate to="/login" />;
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  return session ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <PrivateRoute>
                <UploadFiles />
              </PrivateRoute>
            }
          />
          <Route
            path="/bulk-upload"
            element={
              <PrivateRoute>
                <BulkUpload />
              </PrivateRoute>
            }
          />
          <Route
            path="/shipstation"
            element={
              <PrivateRoute>
                <Shipstation />
              </PrivateRoute>
            }
          />
          <Route
            path="/shipstation/print-history-dtf"
            element={
              <PrivateRoute>
                <DtfPrintHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/ssa/orders"
            element={
              <PrivateRoute>
                <SsaOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="/ssa/order-history"
            element={
              <PrivateRoute>
                <SsaOrderHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <AdminRoute>
                <Categories />
              </AdminRoute>
            }
          />
          <Route
            path="/keywords"
            element={
              <AdminRoute>
                <Keywords />
              </AdminRoute>
            }
          />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}