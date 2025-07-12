import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  return (
    <div className="dashboard" style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <aside
        className="sidebar"
        style={{
          width: '240px',
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          boxSizing: 'border-box'
        }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <NavLink to="classes/institucional">Clases Institucionales</NavLink>
          {!isAdmin && <NavLink to="classes/personal">Clases Personales</NavLink>}
          <NavLink to="timetable">Horario</NavLink>
          {isAdmin && <NavLink to="docentes">Docentes</NavLink>}
          {isAdmin && <NavLink to="banner">Banner Institucional</NavLink>}
          {isAdmin && <NavLink to="admin-data">Administración de Datos</NavLink>}
        </nav>
        {/* Botón cerrar sesión */}
        <button
          onClick={async () => {
            await signOut(auth);
            window.location.href = '/login';
          }}
          style={{
            marginTop: '2rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#c00',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Main content */}
      <main
        className="content"
        style={{
          flexGrow: 1,
          padding: '1.5rem',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
