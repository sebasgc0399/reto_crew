import React from 'react';
import { auth } from '../firebaseConfig';
import './Dashboard.css';

export default function Dashboard() {
  const user = auth.currentUser;

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">
        ¡Hola, {user?.displayName || 'Entrenador'}!
      </h2>

      <section className="dashboard-summary">
        <div className="card">
          <h3>Puntos Totales</h3>
          <p>—</p>
        </div>
        <div className="card">
          <h3>Retos Activos</h3>
          <p>—</p>
        </div>
        <div className="card">
          <h3>Posición</h3>
          <p>—</p>
        </div>
      </section>

      <section className="dashboard-next-steps">
        <button className="btn btn-primary">
          Crear nuevo reto
        </button>
      </section>
    </div>
  );
}
