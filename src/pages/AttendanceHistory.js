// src/pages/AttendanceHistory.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AttendanceHistory({ type }) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [className, setClassName] = useState('');
  const [records, setRecords]   = useState([]);

  useEffect(() => {
    if (!classId) return;
    getDoc(doc(db, 'clases_institucionales', classId))
      .then(snap => { if (snap.exists()) setClassName(snap.data().nombre); });
  }, [classId]);

  useEffect(() => {
    if (!classId || !user?.uid) return;
    const basePath = type === 'institutional'
      ? ['clases_institucionales', classId, 'attendance']
      : ['users', user.uid, 'classes_personal', classId, 'attendance'];
    const q = query(
      collection(db, ...basePath),
      orderBy('date', 'desc'),
      orderBy('reg', 'desc')
    );
    return onSnapshot(q, snap =>
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [type, classId, user.uid]);

  async function handleDelete(id) {
    if (!window.confirm('¿Borrar este registro?')) return;
    const path = type === 'institutional'
      ? ['clases_institucionales', classId, 'attendance', id]
      : ['users', user.uid, 'classes_personal', classId, 'attendance', id];
    await deleteDoc(doc(db, ...path));
  }

  return (
    <div style={{ padding: 16 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← Volver
      </button>
      <h2>
        Asistencias — {type==='institutional'?'Institucional':'Personal'} de {className}
      </h2>
      <button
        onClick={() =>
          navigate(
            type==='institutional'
              ? `/attendance/institucional/${classId}/new`
              : `/attendance/personal/${classId}/new`
          )
        }
        style={{ marginBottom: 16 }}
      >
        + Nueva asistencia
      </button>
      {records.length===0 ? (
        <p>No hay registros.</p>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding:4 }}>Fecha</th>
              <th style={{ padding:4 }}>Reg.</th>
              <th style={{ padding:4 }}>P</th>
              <th style={{ padding:4 }}>T</th>
              <th style={{ padding:4 }}>J</th>
              <th style={{ padding:4 }}>A</th>
              <th style={{ padding:4 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r=>(
              <tr key={r.id}>
                <td style={{ padding:4 }}>
                  {new Date(r.date.seconds*1000).toLocaleDateString()}
                </td>
                <td style={{ padding:4 }}>{r.reg}</td>
                <td style={{ padding:4 }}>{r.presentCount}</td>
                <td style={{ padding:4 }}>{r.leaveCount}</td>
                <td style={{ padding:4 }}>{r.justCount}</td>
                <td style={{ padding:4 }}>{r.absentCount}</td>
                <td style={{ padding:4 }}>
                  <button
                    onClick={()=>navigate(
                      type==='institutional'
                        ? `/attendance/institucional/${classId}/report/${r.id}`
                        : `/attendance/personal/${classId}/report/${r.id}`
                    )}
                    style={{ marginRight:8 }}
                  >
                    Ver
                  </button>
                  <button
                    onClick={()=>navigate(
                      type==='institutional'
                        ? `/attendance/institucional/${classId}/copy/${r.id}`
                        : `/attendance/personal/${classId}/copy/${r.id}`
                    )}
                    style={{ marginRight:8 }}
                  >
                    Copiar
                  </button>
                  <button
                    onClick={()=>navigate(
                      type==='institutional'
                        ? `/attendance/institucional/${classId}/edit/${r.id}`
                        : `/attendance/personal/${classId}/edit/${r.id}`
                    )}
                    style={{ marginRight:8 }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={()=>handleDelete(r.id)}
                    style={{
                      background:'red',
                      color:'white',
                      border:'none',
                      padding:'4px 8px',
                      cursor:'pointer'
                    }}
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
);
}
