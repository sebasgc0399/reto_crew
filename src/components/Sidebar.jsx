// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    onClose();
    navigate('/', { replace: true });
  };

  // Helper para aplicar la clase activa
  const linkClass = ({ isActive }) =>
    isActive ? 'sidebar-link sidebar-link--active' : 'sidebar-link';

  return (
    <nav className={`App-sidebar ${isOpen ? 'open' : ''}`}>
      <h2 className="sidebar-title">Menú</h2>
      <ul className="sidebar-list">
        <li>
          <NavLink
            to="/dashboard"
            className={linkClass}
            onClick={onClose}
          >
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/challenges"
            className={linkClass}
            onClick={onClose}
          >
            Retos
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/settings"
            className={linkClass}
            onClick={onClose}
          >
            Configuraciones
          </NavLink>
        </li>
        <li>
          <button
            className="sidebar-link sidebar-link--button"
            onClick={handleLogout}
          >
            Salir
          </button>
        </li>
      </ul>
    </nav>
  );
}
