import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const [challengesOpen, setChallengesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();  // <— para saber cuándo cambia la ruta

  const handleLogout = async () => {
    await auth.signOut();
    onClose();
    navigate('/', { replace: true });
  };

  // si la ruta cambia, cerramos el acordeón de retos
  useEffect(() => {
    setChallengesOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }) =>
    isActive ? 'sidebar-link sidebar-link--active' : 'sidebar-link';

  return (
    <nav className={`App-sidebar ${isOpen ? 'open' : ''}`}>
      <h2 className="sidebar-title">Menú</h2>
      <ul className="sidebar-list">
        <li>
          <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
            Dashboard
          </NavLink>
        </li>

        {/* Ítem Retos con acordeón */}
        <li>
        <button
          type="button"
          className={`sidebar-link sidebar-link--button ${challengesOpen ? 'expanded' : ''}`}
          onClick={() => setChallengesOpen(o => !o)}
        >
          Retos
          <span className="chevron">{challengesOpen ? '▾' : '▸'}</span>
        </button>
        {challengesOpen && (
          <ul className="sidebar-sublist">
            <li>
              <NavLink to="/my-challenges" end className={linkClass} onClick={onClose}>
                Mis Retos
              </NavLink>
            </li>
            <li>
              <NavLink to="/challenges/new" end className={linkClass} onClick={onClose}>
                Crear Reto
              </NavLink>
            </li>
            <li>
              <NavLink to="/challenges" end className={linkClass} onClick={onClose}>
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
