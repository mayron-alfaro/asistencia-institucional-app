// src/pages/InstitutionalClassDetail.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

export default function InstitutionalClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [className, setClassName] = useState('');
  const [students, setStudents] = useState([]);
  const [nie, setNie] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [nombres, setNombres] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // 1) cargar nombre de la clase
  useEffect(() => {
    if (!classId) return;
    async function fetchClass() {
      const ref = doc(db, 'clases_institucionales', classId);
      const snap = await getDoc(ref);
      setClassName(snap.exists() ? snap.data().nombre : 'Clase desconocida');
    }
    fetchClass();
  }, [classId]);

  // 2) suscribirse a alumnos
  useEffect(() => {
    if (!classId) return;
    const q = query(
      collection(db, 'clases_institucionales', classId, 'students'),
      orderBy('apellidos', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [classId]);

  // 3) añadir o actualizar alumno
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setAdding(true);
    try {
      if (!nie.trim() || !apellidos.trim() || !nombres.trim())
        throw new Error('Todos los campos son obligatorios');
      const data = {
        nie: nie.trim(),
        apellidos: apellidos.trim(),
        nombres: nombres.trim(),
        updatedAt: new Date()
      };
      if (editingId) {
        const ref = doc(db, 'clases_institucionales', classId, 'students', editingId);
        await updateDoc(ref, data);
        setEditingId(null);
      } else {
        await addDoc(
          collection(db, 'clases_institucionales', classId, 'students'),
          { ...data, createdAt: new Date() }
        );
      }
      setNie(''); setApellidos(''); setNombres('');
    } catch (err) {
      setError(err.message);
    }
    setAdding(false);
  }

  // 4) eliminar alumno
  async function handleDeleteStudent(id, fullName) {
    if (window.confirm(`¿Eliminar al alumno "${fullName}"?`)) {
      await deleteDoc(
        doc(db, 'clases_institucionales', classId, 'students', id)
      );
    }
  }

  // 5) preparar edición
  function startEdit(s) {
    setEditingId(s.id);
    setNie(s.nie);
    setApellidos(s.apellidos);
    setNombres(s.nombres);
    setError('');
  }

  // 6) subida masiva XLS
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    try {
      await Promise.all(rows.map(row => {
        if (!row.NIE || !row.Apellidos || !row.Nombres) return;
        return addDoc(
          collection(db, 'clases_institucionales', classId, 'students'),
          {
            nie: String(row.NIE).trim(),
            apellidos: String(row.Apellidos).trim(),
            nombres: String(row.Nombres).trim(),
            createdAt: new Date()
          }
        );
      }));
      alert('Importación completa');
    } catch (err) {
      setError('Error importando XLS: ' + err.message);
    }
    e.target.value = null;
  }

  // cálculo dinámico de anchuras en ch
  const maxNie = Math.max(...students.map(s => String(s.nie).length), 3);
  const maxApellidos = Math.max(...students.map(s => s.apellidos.length), 8);
  const maxNombres = Math.max(...students.map(s => s.nombres.length), 8);

  if (!classId) {
    return <div style={{ padding: '2rem' }}>Cargando …</div>;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
        ← Volver
      </button>
      <h2>Alumnos — {className}</h2>

      {isAdmin && (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label>
              Importar XLS:
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>

          <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="NIE"
              value={nie}
              onChange={e => setNie(e.target.value)}
              required
              style={{ width: `${maxNie}ch`, marginRight: 8 }}
            />
            <input
              type="text"
              placeholder="Apellidos"
              value={apellidos}
              onChange={e => setApellidos(e.target.value)}
              required
              style={{ width: `${maxApellidos}ch`, marginRight: 8 }}
            />
            <input
              type="text"
              placeholder="Nombres"
              value={nombres}
              onChange={e => setNombres(e.target.value)}
              required
              style={{ width: `${maxNombres}ch`, marginRight: 8 }}
            />
            <button type="submit" disabled={adding}>
              {adding
                ? editingId ? 'Actualizando…' : 'Agregando…'
                : editingId ? 'Actualizar' : 'Añadir alumno'}
            </button>
            {error && <span style={{ color: 'red', marginLeft: 10 }}>{error}</span>}
          </form>
        </>
      )}

      {students.length === 0 ? (
        <p>No hay alumnos.</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ minWidth: `${maxNie}ch`, textAlign: 'left' }}>NIE</th>
              <th style={{ minWidth: `${maxApellidos}ch`, textAlign: 'left' }}>Apellidos</th>
              <th style={{ minWidth: `${maxNombres}ch`, textAlign: 'left' }}>Nombres</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td style={{ padding: '4px' }}>{s.nie}</td>
                <td style={{ padding: '4px' }}>{s.apellidos}</td>
                <td style={{ padding: '4px' }}>{s.nombres}</td>
                {isAdmin && (
                  <td style={{ padding: '4px' }}>
                    <button onClick={() => startEdit(s)} style={{ marginRight: 6 }}>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(s.id, `${s.apellidos} ${s.nombres}`)}
                      style={{
                        background: 'red', color: 'white', border: 'none', padding: '2px 6px', cursor: 'pointer'
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
