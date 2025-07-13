// src/components/ParticipantsList.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Loader from './Loader';
import PageTitle from './PageTitle';
import './ParticipantsList.css';

export default function ParticipantsList({ challengeId }) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [isCreator, setIsCreator]       = useState(false);
  // Para controlar cuál menú está abierto
  const [openMenuFor, setOpenMenuFor]   = useState(null);
  const menusRef                        = useRef({});

  // 1) Verificar si soy el creador
  useEffect(() => {
    if (!challengeId || !user) return;
    (async () => {
      const chSnap = await getDoc(doc(db, 'challenges', challengeId));
      setIsCreator(chSnap.exists() && chSnap.data().createdBy === user.uid);
    })();
  }, [challengeId, user]);

  // 2) Cargar lista de participantes
  useEffect(() => {
    if (!challengeId) return;
    (async () => {
      setLoading(true);
      const partsSnap = await getDocs(
        collection(db, 'challenges', challengeId, 'participants')
      );
      setParticipants(
        partsSnap.docs.map(d => ({
          uid:  d.id,
          name: d.data().name || d.id
        }))
      );
      setLoading(false);
    })();
  }, [challengeId]);

  // 3) Cerrar cualquier menú al clicar fuera
  useEffect(() => {
    function handleOutside(e) {
      if (openMenuFor != null) {
        const ref = menusRef.current[openMenuFor];
        if (ref && !ref.contains(e.target)) {
          setOpenMenuFor(null);
        }
      }
    }
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, [openMenuFor]);

  // 4) Acciones
  const handleRemove = async uidToRemove => {
    if (!window.confirm('¿Eliminar a este participante?')) return;
    setLoading(true);

    try {
      // 1) Preparamos un batch
      const batch = writeBatch(db);

      // 2) Borramos todas las entradas de este usuario
      const entriesRef = collection(db, 'challenges', challengeId, 'entries');
      const entriesSnap = await getDocs(entriesRef);
      entriesSnap.docs.forEach(entryDoc => {
        if (entryDoc.data().userId === uidToRemove) {
          batch.delete(
            doc(db, 'challenges', challengeId, 'entries', entryDoc.id)
          );
        }
      });

      // 3) Borramos al participante
      batch.delete(
        doc(db, 'challenges', challengeId, 'participants', uidToRemove)
      );

      // 4) Commit del batch
      await batch.commit();

      // 5) Refrescamos UI
      setParticipants(curr => curr.filter(p => p.uid !== uidToRemove));
      setOpenMenuFor(null);
    } catch (err) {
      console.error('Error eliminando participante y entradas:', err);
      alert('No se pudo eliminar al participante. Intenta de nuevo.');
    } finally {
      setLoading(false);        
    }
  };

  const handleReassign = async uidToAssign => {
    if (!window.confirm('¿Hacer a este participante el nuevo creador?')) return;
    // 1) Actualiza el campo createdBy en el reto
    await updateDoc(doc(db, 'challenges', challengeId), {
      createdBy: uidToAssign
    });
    // 2) Refresca localmente
    setIsCreator(false);
    setOpenMenuFor(null);
    // Opcional: podrías indicar cambio de creador en UI
    alert('¡Creador reasignado correctamente!');
  };

  if (loading) return <Loader text="Cargando participantes…" />;

  return (
    <div
      className={`participants-list ${
        participants.length > 0 ? 'with-counter' : ''
      }`}
      data-count={participants.length}
    >
      <PageTitle level={4} variant="small">Participantes</PageTitle>

      {participants.length === 0 ? (
        <p className="empty-state">No hay participantes aún.</p>
      ) : (
        <ul>
          {participants.map(p => (
            <li
  key={p.uid}
  className={openMenuFor === p.uid ? 'menu-open' : ''}
  style={{ position: 'relative' }}
>
              <span>{p.name}</span>

              {isCreator && p.uid !== user.uid && (
                <div
                  className="participants-list__menu"
                  ref={el => (menusRef.current[p.uid] = el)}
                >
                  <button
                    className="participants-list__menu-btn"
                    onClick={() =>
                      setOpenMenuFor(o => (o === p.uid ? null : p.uid))
                    }
                    aria-label="Opciones"
                  >
                    ⋮
                  </button>

                  {openMenuFor === p.uid && (
                    <ul className="participants-list__dropdown">
                      <li onClick={() => handleRemove(p.uid)}>
                        Eliminar
                      </li>
                      <li onClick={() => handleReassign(p.uid)}>
                        Hacer creador
                      </li>
                    </ul>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
