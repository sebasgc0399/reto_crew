import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home           from './pages/Home';
import Dashboard      from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar        from './components/Sidebar';
import Settings from './pages/Settings';
import { useAuth }    from './contexts/AuthContext';
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

            {/* Backdrop para cerrar al clicar fuera */}
            <div
              className={`backdrop ${sidebarOpen ? 'show' : ''}`}
              onClick={() => setSidebarOpen(false)}
            />
          </>
        )}

        <main className={`App-main ${user && sidebarOpen ? 'shifted' : ''}`}>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

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