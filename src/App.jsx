import React, { useState }     from 'react';
import { Routes, Route }       from 'react-router-dom';
import { useAuth }             from './contexts/AuthContext';

import Home                    from './pages/Home';
import Dashboard               from './pages/Dashboard';
import Settings                from './pages/Settings';
import ChallengeForm           from './pages/ChallengeForm';
import ChallengesList          from './pages/ChallengesList';
import ChallengeDetail         from './pages/ChallengeDetail';
import ProtectedRoute          from './components/ProtectedRoute';
import Sidebar                 from './components/Sidebar';
import PublicRoute             from './components/PublicRoute';

import './App.css';

export default function App() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        {user && (
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
        )}
        RetoCrew
      </header>

      <div className="App-body">
        {user && (
          <>
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <div
              className={`backdrop ${sidebarOpen ? 'show' : ''}`}
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}

        <main className={`App-main ${user && sidebarOpen ? 'shifted' : ''}`}>
          <Routes>
            {/* Ruta pública: Home solo si NO hay usuario */}
  +         <Route
              path="/"
              element={
                <PublicRoute>
                  <Home />
                </PublicRoute>
              }
            />

            {/* Listado de retos */}
            <Route
              path="/challenges"
              element={
                <ProtectedRoute>
                  <ChallengesList />
                </ProtectedRoute>
              }
            />

            {/* Detalle de un reto (placeholder) */}
            <Route
              path="/challenges/:id"
              element={
                <ProtectedRoute>
                  <ChallengeDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/challenges/new"
              element={
                <ProtectedRoute>
                  <ChallengeForm />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/challenges/:id/edit"
              element={
                <ProtectedRoute>
                  <ChallengeForm />
                </ProtectedRoute>
              }
            />

            {/* Dashboard principal */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Configuraciones */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>

      <footer className="App-footer">© 2025 RetoCrew</footer>
    </div>
  );
}
