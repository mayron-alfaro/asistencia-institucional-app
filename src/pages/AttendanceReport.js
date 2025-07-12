// src/pages/AttendanceReport.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function AttendanceReport({ type }) {
  const { classId, recordId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [className, setClassName] = useState('');
  const [meta, setMeta]         = useState({ date:null, reg:null });
  const [students, setStudents] = useState([]);
  const [filter, setFilter]     = useState('');

  useEffect(()=>{
    if (!classId) return;
    getDoc(doc(db,'clases_institucionales',classId))
      .then(s=>s.exists() && setClassName(s.data().nombre));
  },[classId]);

  useEffect(()=>{
    if (!classId||!recordId) return;
    const pathMeta = type==='institutional'
      ? ['clases_institucionales',classId,'attendance',recordId]
      : ['users',user.uid,'classes_personal',classId,'attendance',recordId];
    getDoc(doc(db,...pathMeta))
      .then(s=>{
        if(s.exists()){
          const d=s.data();
          setMeta({ date:d.date.toDate(), reg:d.reg });
        }
      });
    const pathRecs = type==='institutional'
      ? ['clases_institucionales',classId,'attendance',recordId,'records']
      : ['users',user.uid,'classes_personal',classId,'attendance',recordId,'records'];
    getDocs(query(collection(db,...pathRecs), orderBy('status','asc')))
      .then(snap=>{
        const list = snap.docs.map(d=>({ id:d.id, status:d.data().status }));
        Promise.all(list.map(item=>{
          const stuRef = type==='institutional'
            ? doc(db,'clases_institucionales',classId,'students',item.id)
            : doc(db,'users',user.uid,'classes_personal',classId,'students',item.id);
          return getDoc(stuRef).then(snap=>{
            return {
              id:item.id,
              apellidos:snap.exists()?snap.data().apellidos:'',
              nombres:  snap.exists()?snap.data().nombres:'',
              status:item.status
            };
          });
        })).then(full=>setStudents(full));
      });
  },[type,classId,recordId,user.uid]);

  const filtered = filter
    ? students.filter(s=>s.status===filter)
    : students;

  return (
    <div style={{ padding:16 }}>
      <button onClick={()=>navigate(-1)} style={{ marginBottom:16 }}>
        ← Volver
      </button>
      <h2>Reporte de asistencia — {className}</h2>
      {meta.date && (
        <p>
          Fecha: {meta.date.toLocaleDateString()} | Reg: {meta.reg}
        </p>
      )}
      <label>
        Filtrar estado:{' '}
        <select value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value=''>Todos</option>
          <option value='P'>Presente</option>
          <option value='T'>Tarde</option>
          <option value='J'>Justificado</option>
          <option value='A'>Ausente</option>
        </select>
      </label>
      <table style={{ width:'100%',borderCollapse:'collapse',marginTop:16 }}>
        <thead>
          <tr>
            <th style={{ borderBottom:'1px solid #ccc',padding:4 }}>Apellidos</th>
            <th style={{ borderBottom:'1px solid #ccc',padding:4 }}>Nombres</th>
            <th style={{ borderBottom:'1px solid #ccc',padding:4 }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(s=>(
            <tr key={s.id}>
              <td style={{ padding:4 }}>{s.apellidos}</td>
              <td style={{ padding:4 }}>{s.nombres}</td>
              <td style={{ padding:4 }}>{s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
);
}
