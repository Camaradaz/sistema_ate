import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { HistoryProvider } from './context/HistoryContext';
import { StorageProvider } from './context/StorageContext';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import AffiliatePage from './pages/AffiliatePage';
import ChildrenPage from './pages/ChildrenPage';
import DelegatePage from './pages/DelegatePage';
import BenefitsPage from './pages/BenefitsPage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import SectorsPage from './pages/SectorsPage';
import { Toaster } from 'react-hot-toast';

// Componente para proteger rutas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <StorageProvider>
          <HistoryProvider>
            <Router>
              <div className="min-h-screen bg-gray-100">
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* Rutas protegidas */}
                  <Route
                    path="/home"
                    element={
                      <PrivateRoute>
                        <HomePage />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/home" />} />
                  
                  <Route path="/afiliados" element={
                    <ProtectedRoute>
                      <>
                        <Navbar />
                        <div className="container mx-auto px-4 py-8">
                          <AffiliatePage />
                        </div>
                      </>
                    </ProtectedRoute>
                  } />
                  <Route path="/hijos" element={
                    <ProtectedRoute>
                      <>
                        <Navbar />
                        <div className="container mx-auto px-4 py-8">
                          <ChildrenPage />
                        </div>
                      </>
                    </ProtectedRoute>
                  } />
                  <Route path="/delegados" element={
                    <ProtectedRoute>
                      <>
                        <Navbar />
                        <div className="container mx-auto px-4 py-8">
                          <DelegatePage />
                        </div>
                      </>
                    </ProtectedRoute>
                  } />
                  <Route path="/sectores" element={
                    <ProtectedRoute>
                      <>
                        <Navbar />
                        <div className="container mx-auto px-4 py-8">
                          <SectorsPage />
                        </div>
                      </>
                    </ProtectedRoute>
                  } />
                  <Route path="/beneficios" element={
                    <ProtectedRoute>
                      <>
                        <Navbar />
                        <div className="container mx-auto px-4 py-8">
                          <BenefitsPage />
                        </div>
                      </>
                    </ProtectedRoute>
                  } />
                  <Route path="/historial" element={
                    <ProtectedRoute>
                      <>
                        <Navbar />
                        <div className="container mx-auto px-4 py-8">
                          <HistoryPage />
                        </div>
                      </>
                    </ProtectedRoute>
                  } />
                </Routes>
              </div>
            </Router>
          </HistoryProvider>
        </StorageProvider>
      </AuthProvider>
    </>
  );
}

export default App;