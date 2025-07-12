// src/pages/AttendanceForm.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AttendanceForm({ type, mode }) {
  const { classId, recordId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEdit = mode === 'edit';
  const isCopy = mode === 'copy';

  const [className, setClassName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [reg, setReg] = useState(1);
  const [students, setStudents] = useState([]);
  const [availableRegs, setAvailableRegs] = useState([1, 2, 3, 4, 5]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 0) Cargar nombre de la clase
  useEffect(() => {
    if (!classId) return;
    getDoc(doc(db, 'clases_institucionales', classId))
      .then(snap => {
        if (snap.exists()) setClassName(snap.data().nombre);
      });
  }, [classId]);

  // 1) Cargar alumnos
  useEffect(() => {
    if (!classId || !user?.uid) return;
    const path = type === 'institutional'
      ? ['clases_institucionales', classId, 'students']
      : ['users', user.uid, 'classes_personal', classId, 'students'];
    getDocs(collection(db, ...path)).then(snap => {
      setStudents(snap.docs.map(d => ({
        id: d.id,
        apellidos: d.data().apellidos,
        nombres: d.data().nombres,
        status: 'P'
      })));
    });
  }, [type, classId, user?.uid]);

  // 2) Precargar para edit o copy
  useEffect(() => {
    if ((isEdit || isCopy) && recordId) {
      const attRef = doc(db, 'clases_institucionales', classId, 'attendance', recordId);
      getDoc(attRef).then(snap => {
        if (!snap.exists()) return;
        const data = snap.data();
        setDate(data.date.toDate().toISOString().substr(0, 10));
        if (isEdit) setReg(data.reg);
      });
      getDocs(collection(db, 'clases_institucionales', classId, 'attendance', recordId, 'records'))
        .then(snap => {
          const map = {};
          snap.docs.forEach(d => map[d.id] = d.data().status);
          setStudents(prev =>
            prev.map(s => ({
              ...s,
              status: map[s.id] || s.status
            }))
          );
        });
    }
  }, [isEdit, isCopy, recordId, classId]);

  // 3) Recalcular regs disponibles al cambiar fecha
  useEffect(() => {
    if (!classId) return;
    getDocs(collection(db, 'clases_institucionales', classId, 'attendance')).then(snap => {
      const used = snap.docs
        .map(d => d.data())
        .filter(d => d.date.toDate().toISOString().substr(0, 10) === date)
        .map(d => d.reg);
      if (isEdit) {
        const idx = used.indexOf(reg);
        if (idx > -1) used.splice(idx, 1);
      }
      const avail = [1, 2, 3, 4, 5].filter(n => !used.includes(n));
      setAvailableRegs(avail);
      if (!isEdit) setReg(avail[0] || 1);
    });
  }, [date, classId, isEdit, reg]);

  // Cambiar estado individual
  function toggleStatus(i) {
    const cycle = ['P', 'T', 'J', 'A'];
    setStudents(prev =>
      prev.map((s, idx) =>
        idx === i
          ? { ...s, status: cycle[(cycle.indexOf(s.status) + 1) % cycle.length] }
          : s
      )
    );
  }

  // Guardar (new, edit o copy)
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    // Construir fecha local para evitar desplazamiento UTC
    const [y, m, d] = date.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);

    const parentCol = type === 'institutional'
      ? collection(db, 'clases_institucionales', classId, 'attendance')
      : collection(db, 'users', user.uid, 'classes_personal', classId, 'attendance');

    try {
      const presentCount = students.filter(s => s.status === 'P').length;
      const absentCount = students.filter(s => s.status === 'A').length;
      const leaveCount = students.filter(s => s.status === 'T').length;
      const justCount = students.filter(s => s.status === 'J').length;

      let attRef;
      if (isEdit) {
        attRef = doc(db, ...parentCol.path.split('/'), recordId);
        await updateDoc(attRef, {
          date: localDate,
          reg,
          presentCount,
          absentCount,
          leaveCount,
          justCount
        });
      } else {
        attRef = await addDoc(parentCol, {
          date: localDate,
          reg,
          presentCount,
          absentCount,
          leaveCount,
          justCount,
          createdAt: serverTimestamp()
        });
      }

      await Promise.all(
        students.map(s =>
          setDoc(
            doc(db, ...parentCol.path.split('/'), attRef.id, 'records', s.id),
            { status: s.status }
          )
        )
      );

      navigate(-1);
    } catch (err) {
      console.error(err);
      setError('Error al guardar la asistencia.');
    }

    setSaving(false);
  }

  return (
    <div style={{ padding: 16 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← Volver
      </button>
      <h2>
        {isEdit ? 'Editar' : isCopy ? 'Copiar' : 'Nueva'} asistencia — {className}
      </h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <label>
          Fecha:{' '}
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </label>{' '}
        <label>
          Reg:{' '}
          <select
            value={reg}
            onChange={e => setReg(Number(e.target.value))}
            required
          >
            {availableRegs.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>{' '}
        <button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar asistencia'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', padding: 4 }}>Apellidos</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: 4 }}>Nombres</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: 4 }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => (
            <tr key={s.id}>
              <td style={{ padding: 4 }}>{s.apellidos}</td>
              <td style={{ padding: 4 }}>{s.nombres}</td>
              <td
                style={{ padding: 4, cursor: 'pointer' }}
                onClick={() => toggleStatus(i)}
              >
                {s.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
