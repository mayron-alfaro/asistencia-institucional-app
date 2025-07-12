// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InstitutionalClasses from './pages/InstitutionalClasses';
import InstitutionalClassForm from './pages/InstitutionalClassForm';
import InstitutionalClassDetail from './pages/InstitutionalClassDetail';
import AttendanceHistory from './pages/AttendanceHistory';
import AttendanceForm from './pages/AttendanceForm';
import AttendanceReport from './pages/AttendanceReport';
import PersonalClasses from './pages/PersonalClasses';
import Timetable from './pages/Timetable';
import GestionDocentes from './pages/GestionDocentes';
import { useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      padding: '2rem',
      fontSize: '1.5rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh'
    }}>
      Cargando, por favor espere...
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<PrivateRoute><Dashboard/></PrivateRoute>}>
          {/* Clases institucionales */}
          <Route path="classes/institucional" element={<InstitutionalClasses/>}/>
          <Route path="classes/institucional/new" element={<InstitutionalClassForm mode="new"/>}/>
          <Route path="classes/institucional/:classId/edit" element={<InstitutionalClassForm mode="edit"/>}/>
          <Route path="classes/institucional/:classId" element={<InstitutionalClassDetail/>}/>

          {/* Asistencia institucional */}
          <Route path="attendance/institucional/:classId" element={<AttendanceHistory type="institutional"/>}/>
          <Route path="attendance/institucional/:classId/new" element={<AttendanceForm type="institutional" mode="new"/>}/>
          <Route path="attendance/institucional/:classId/edit/:recordId" element={<AttendanceForm type="institutional" mode="edit"/>}/>
          <Route path="attendance/institucional/:classId/copy/:recordId" element={<AttendanceForm type="institutional" mode="copy"/>}/>
          <Route path="attendance/institucional/:classId/report/:recordId" element={<AttendanceReport type="institutional"/>}/>

          {/* Resto de rutas... */}
          <Route path="classes/personal" element={<PersonalClasses/>}/>
          <Route path="attendance/personal/:classId" element={<AttendanceHistory type="personal"/>}/>
          <Route path="attendance/personal/:classId/new" element={<AttendanceForm type="personal" mode="new"/>}/>
          <Route path="attendance/personal/:classId/edit/:recordId" element={<AttendanceForm type="personal" mode="edit"/>}/>
          <Route path="attendance/personal/:classId/copy/:recordId" element={<AttendanceForm type="personal" mode="copy"/>}/>
          <Route path="attendance/personal/:classId/report/:recordId" element={<AttendanceReport type="personal"/>}/>
          <Route path="timetable" element={<Timetable/>}/>
          <Route path="docentes" element={<GestionDocentes/>}/>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
