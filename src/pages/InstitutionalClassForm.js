// src/pages/InstitutionalClassForm.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export default function InstitutionalClassForm({ mode }) {
  const { classId } = useParams();           // sólo existe en modo “edit”
  const navigate = useNavigate();

  const isEdit = mode === 'edit';

  const [nombre, setNombre] = useState('');
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);

  // Si estamos editando, carga el nombre actual
  useEffect(() => {
    if (!isEdit || !classId) return;
    getDoc(doc(db, 'clases_institucionales', classId))
      .then(snap => {
        if (snap.exists()) setNombre(snap.data().nombre);
        else setError('La clase no existe');
      })
      .catch(err => setError(err.message));
  }, [isEdit, classId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const n = nombre.trim();
    if (!n) {
      setError('El nombre no puede quedar vacío.');
      setSaving(false);
      return;
    }

    try {
      if (isEdit) {
        // actualizar documento existente
        const ref = doc(db, 'clases_institucionales', classId);
        await updateDoc(ref, { nombre: n });
      } else {
        // crear nueva clase
        await addDoc(collection(db, 'clases_institucionales'), { nombre: n });
      }
      navigate('/classes/institucional');
    } catch (err) {
      setError(err.message);
    }

    setSaving(false);
  }

  return (
    <div style={{ padding: 16 }}>
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        ← Volver
      </button>
      <h2>{isEdit ? 'Editar clase institucional' : 'Nueva clase institucional'}</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Nombre de la clase:{' '}
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ejemplo: 1-14"
            required
            style={{ marginRight: 8 }}
          />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? (isEdit ? 'Guardando…' : 'Creando…') 
                  : (isEdit ? 'Guardar cambios' : 'Crear clase')}
        </button>
      </form>

      {error && (
        <p style={{ color: 'red', marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}
