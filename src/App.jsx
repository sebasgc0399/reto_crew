import React, { useState }     from 'react';
import { Routes, Route, Navigate }   from 'react-router-dom';
import { useAuth }             from './contexts/AuthContext';

import Home                   from './pages/Home';
import Profile                from './pages/Profile';
import Achievements           from './pages/Achievements';
import Connections           from './pages/Connections';
import Dashboard              from './pages/Dashboard';
import Settings               from './pages/Settings';
import ChallengesList         from './pages/ChallengesList';
import ChallengeForm          from './pages/ChallengeForm';
import ChallengeDetail        from './pages/ChallengeDetail';
import JoinChallenge          from './pages/JoinChallenge';
import EntryForm              from './pages/EntryForm';
import ChallengeDashboard     from './pages/ChallengeDashboard';
import MyChallenges           from './pages/MyChallenges';
import ExerciseCapture        from './pages/ExerciseCapture';

import ProtectedRoute         from './components/ProtectedRoute';
import PublicRoute            from './components/PublicRoute';
import Sidebar                from './components/Sidebar';

import './App.css';

export default function App() {
  const { user } = useAuth();
  const currentUsername = user?.name;
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
              path="/my-challenges"
              element={
                <ProtectedRoute>
                  <MyChallenges />
                </ProtectedRoute>
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

            <Route
              path="/challenges/:id/join"
              element={
                <ProtectedRoute>
                  <JoinChallenge />
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

            {/* Registrar */}
            <Route
              path="/challenges/:id/entry"
              element={
                <ProtectedRoute>
                  <EntryForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/challenges/:id/capture"
              element={
                <ProtectedRoute>
                  <ExerciseCapture />
                </ProtectedRoute>
              }
            />

            {/* Dashboard específico del reto */}
            <Route
              path="/profile/:id/dashboard"
              element={
                <ProtectedRoute>
                  <ChallengeDashboard />
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

            {/* Primero conexiones (ya que es `/profile/:name/conexiones`) */}
            <Route
              path="/profile/:name/conexiones"
              element={
                <ProtectedRoute>
                  <Connections />
                </ProtectedRoute>
              }
            />

            {/* Perfil público /profile/:name */}
            <Route
              path="/profile/:name"
              element={<Profile />}
            />

            {/* Página de logros */}
            <Route
              path="/profile/:name/achievements"
              element={
                <ProtectedRoute>
                  <Achievements />
                </ProtectedRoute>
              }
            />

            {/* Si entras a /profile sin slug, te redirijo a tu propio perfil */}
            <Route
              path="/profile"
              element={
                currentUsername
                  ? <Navigate to={`/profile/${currentUsername}`} replace />
                  : <Navigate to="/" replace />
              }
            />

            {/* Fallback 404 opcional */}
            <Route path="*" element={<Navigate to="/" replace />} />

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
