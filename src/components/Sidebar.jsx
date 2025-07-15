// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';   // ⬅️ para obtener user
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();                      // ⬅️ tu usuario
  const [challengesOpen, setChallengesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Si la ruta cambia, cerramos el acordeón de retos
  useEffect(() => {
    setChallengesOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await auth.signOut();
    onClose();
    navigate('/', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    isActive ? 'sidebar-link sidebar-link--active' : 'sidebar-link';

  // Determinamos el slug para el perfil:
  // Aquí asumimos que `user.displayName` es único y seguro para usar en la URL.
  const profileSlug = user?.displayName;

  return (
    <nav className={`App-sidebar ${isOpen ? 'open' : ''}`}>
      <h2 className="sidebar-title">Menú</h2>
      <ul className="sidebar-list">
        {profileSlug && (
          <li>
            <NavLink
              to={`/profile/${profileSlug}`}
              className={linkClass}
              onClick={onClose}
            >
              Mi perfil
            </NavLink>
          </li>
        )}

        <li>
          <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
            Dashboard
          </NavLink>
        </li>

        {/* Ítem Retos con acordeón */}
        <li>
          <button
            type="button"
            className={`sidebar-link sidebar-link--button ${
              challengesOpen ? 'expanded' : ''
            }`}
            onClick={() => setChallengesOpen(o => !o)}
          >
            Retos
            <span className="chevron">{challengesOpen ? '▾' : '▸'}</span>
          </button>
          {challengesOpen && (
            <ul className="sidebar-sublist">
              <li>
                <NavLink
                  to="/my-challenges"
                  end
                  className={linkClass}
                  onClick={onClose}
                >
                  Mis Retos
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/challenges/new"
                  end
                  className={linkClass}
                  onClick={onClose}
                >
                  Crear Reto
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/challenges"
                  end
                  className={linkClass}
                  onClick={onClose}
                >
                  Ver Retos
                </NavLink>
              </li>
            </ul>
          )}
        </li>

        <li>
          <NavLink to="/settings" className={linkClass} onClick={onClose}>
            Configuraciones
          </NavLink>
        </li>
        <li>
          <button
            className="sidebar-link sidebar-link--button sidebar-link--logout"
            onClick={handleLogout}
          >
            Salir
          </button>
        </li>
      </ul>
    </nav>
  );
}
