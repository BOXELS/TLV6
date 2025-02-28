import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ShipstationTags from './pages/ShipstationTags';
import Dashboard from './pages/Dashboard';
import UploadFiles from './pages/UploadFiles';
import BulkUpload from './pages/BulkUpload';
import DtfPrintHistory from './pages/DtfPrintHistory';
import SsaOrders from './pages/SsaOrders';
import SsaOrderHistory from './pages/SsaOrderHistory';
import VersionHistory from './pages/VersionHistory';
import DtfPrintList from './pages/DtfPrintList';
import JaneExport from './pages/JaneExport';
import Categories from './pages/Categories';
import Keywords from './pages/Keywords';
import Settings from './pages/Settings';
import EditTitles from './pages/EditTitles';
import JaneSettings from './pages/JaneSettings';
import ImportCsv from './pages/ImportCsv';
import Users from './pages/Users';
import Shipstation from './pages/Shipstation';
import GoogleCallback from './pages/GoogleCallback';
import EditDesign from './pages/EditDesign';
import EditMockupOrder from './pages/EditMockupOrder';
import Supabase from './pages/Supabase';
import UploadAI from './pages/UploadAI';
import ClothingStyles from './pages/ClothingStyles';
import UploadAIProcessor from './pages/UploadAIProcessor';
import { useAdmin } from './hooks/useAdmin';
import Mockups from './pages/Mockups'; 
import AddMockupTemplate from './pages/AddMockupTemplate';
import EditMockupTemplate from './pages/EditMockupTemplate';
import MockupGeneratorV2Page from './pages/MockupGeneratorV2';

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
            path="/design/:id"
            element={
              <PrivateRoute>
                <EditDesign />
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
            path="/upload-ai"
            element={
              <PrivateRoute>
                <UploadAI />
              </PrivateRoute>
            }
          />
          <Route
            path="/upload-ai/processor"
            element={
              <PrivateRoute>
                <UploadAIProcessor />
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
            path="/shipstation/tags"
            element={
              <PrivateRoute>
                <ShipstationTags />
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
            path="/shipstation/print-list"
            element={
              <PrivateRoute>
                <DtfPrintList />
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
            path="/jane-export"
            element={
              <PrivateRoute>
                <JaneExport />
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
            path="/clothing-styles"
            element={
              <AdminRoute>
                <ClothingStyles />
              </AdminRoute>
            }
          />
          <Route
            path="/version-history"
            element={
              <AdminRoute>
                <VersionHistory />
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
            path="/jane-settings"
            element={
              <AdminRoute>
                <JaneSettings />
              </AdminRoute>
            }
          />
          <Route
            path="/import-csv"
            element={
              <AdminRoute>
                <ImportCsv />
              </AdminRoute>
            }
          />
          <Route
            path="/supabase"
            element={
              <AdminRoute>
                <Supabase />
              </AdminRoute>
            }
          />
          <Route
            path="/edit-titles"
            element={
              <AdminRoute>
                <EditTitles />
              </AdminRoute>
            }
          />
          <Route
            path="/edit-mockup-order"
            element={
              <PrivateRoute>
                <EditMockupOrder />
              </PrivateRoute>
            }
          />
          <Route
            path="/mockups"
            element={
              <AdminRoute>
                <Mockups />
              </AdminRoute>
            }
          />
          <Route
            path="/mockups/add"
            element={
              <AdminRoute>
                <AddMockupTemplate />
              </AdminRoute>
            }
          />
          <Route
            path="/mockups/v2/:id"
            element={
              <AdminRoute>
                <MockupGeneratorV2Page />
              </AdminRoute>
            }
          />
          <Route
            path="/mockups/edit/:id"
            element={
              <AdminRoute>
                <EditMockupTemplate />
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
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}