// src/pages/InstitutionalClasses.js
import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function InstitutionalClasses() {
  const [clases, setClases] = useState([]);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'clases_institucionales'));
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        nombre: d.data().nombre
      }));
      // ordenar numéricamente por "grado-sección"
      list.sort((a, b) => {
        const [g1, s1] = a.nombre.split('-').map(Number);
        const [g2, s2] = b.nombre.split('-').map(Number);
        if (g1 !== g2) return g1 - g2;
        return s1 - s2;
      });
      setClases(list);
    });
  }, []);

  async function handleDeleteClass(id, nombre) {
    if (!window.confirm(`¿Eliminar la clase "${nombre}"?`)) return;
    await deleteDoc(doc(db, 'clases_institucionales', id));
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Clases Institucionales</h2>
      {isAdmin && (
        <button
          onClick={() => navigate('/classes/institucional/new')}
          style={{ marginBottom: 16 }}
        >
          + Nueva clase
        </button>
      )}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {clases.map(clase => (
          <li
            key={clase.id}
            style={{
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ flexGrow: 1 }}>{clase.nombre}</span>

            <button
              onClick={() => navigate(`/classes/institucional/${clase.id}`)}
            >
              Ver alumnos
            </button>

            <button
              onClick={() =>
                navigate(`/attendance/institucional/${clase.id}`)
              }
            >
              Asistencia
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() =>
                    navigate(`/classes/institucional/${clase.id}/edit`)
                  }
                >
                  Editar clase
                </button>
                <button
                  onClick={() =>
                    handleDeleteClass(clase.id, clase.nombre)
                  }
                  style={{
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                >
                  Eliminar clase
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
