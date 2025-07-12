import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';

export default function GestionDocentes() {
  const [docentes, setDocentes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'docente'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        nombre: doc.data().nombre || '—'
      }));
      setDocentes(lista);
    });
    return () => unsubscribe();
  }, []);

  async function handleAddOrEditDocente(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setAgregando(true);

    try {
      if (editandoId) {
        await updateDoc(doc(db, 'users', editandoId), {
          nombre,
          email,
        });
        setEditandoId(null);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;
        await setDoc(doc(db, 'users', uid), {
          email,
          nombre,
          role: 'docente',
          creado: new Date()
        });
        alert('Docente creado correctamente. Por seguridad, debes volver a iniciar sesión como administrador.');
        await signOut(auth);
        window.location.href = '/login';
        return; // ← Detenemos el flujo aquí
      }
      setNombre('');
      setEmail('');
      setPassword('');
      setShowForm(false);
    } catch (err) {
      setError('Error: ' + err.message);
    }
    setAgregando(false);
  }

  async function handleDelete(id, email) {
    if (window.confirm('¿Estás seguro de eliminar este docente?\nRecuerda: Esto solo elimina al docente del panel, pero NO de la autenticación. Si deseas volver a registrar este correo, elimínalo también desde Firebase Authentication (Consola).')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        alert('Docente eliminado del panel. Si quieres volver a registrar este correo, debes borrarlo de Firebase Auth (Consola) también.');
      } catch (err) {
        alert('No se pudo eliminar: ' + err.message);
      }
    }
  }

  function iniciarEdicion(docente) {
    setEditandoId(docente.id);
    setNombre(docente.nombre);
    setEmail(docente.email);
    setShowForm(true);
    setPassword('');
    setMensaje('');
    setError('');
  }

  // RESET PASSWORD
  async function handleResetPassword(email) {
    setMensaje('');
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMensaje(`Correo de restablecimiento enviado a ${email}.`);
    } catch (err) {
      setError('Error enviando correo: ' + err.message);
    }
  }

  return (
    <div style={{ padding: '1rem', maxWidth: 650, margin: '0 auto' }}>
      <h2>Gestión de Docentes</h2>
      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditandoId(null);
          setNombre('');
          setEmail('');
          setPassword('');
          setError('');
          setMensaje('');
        }}
        style={{ marginBottom: '1rem' }}
      >
        {showForm ? 'Cancelar' : 'Añadir Docente'}
      </button>

      {showForm && (
        <form onSubmit={handleAddOrEditDocente} style={{ marginBottom: '2rem', background: '#f5f5f5', padding: 20, borderRadius: 6 }}>
          <div>
            <label>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label>Correo *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={!!editandoId}
              style={{ width: '100%' }}
            />
          </div>
          {!editandoId && (
            <div>
              <label>Contraseña temporal *</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          )}
          <button type="submit" disabled={agregando} style={{ marginTop: '1rem' }}>
            {agregando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Guardar'}
          </button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '0.5rem' }}>Correo</th>
            <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '0.5rem' }}>Nombre</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {docentes.map(d => (
            <tr key={d.email}>
              <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{d.email}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>{d.nombre}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '0.5rem' }}>
                <button onClick={() => iniciarEdicion(d)} style={{ marginRight: '0.5rem' }}>Editar</button>
                <button onClick={() => handleDelete(d.id, d.email)} style={{ color: 'red', marginRight: '0.5rem' }}>Eliminar</button>
                <button onClick={() => handleResetPassword(d.email)} style={{ color: 'blue' }}>Restablecer contraseña</button>
              </td>
            </tr>
          ))}
          {docentes.length === 0 && (
            <tr>
              <td colSpan="3" style={{ padding: '0.5rem', textAlign: 'center' }}>No hay docentes registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Mensaje general abajo de la tabla */}
      {mensaje && !showForm && <p style={{ color: 'green' }}>{mensaje}</p>}
      {error && !showForm && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
