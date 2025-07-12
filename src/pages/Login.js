import React, { useRef, useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const emailRef = useRef();
  const passRef = useRef();
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Si ya hay sesión, redirige al dashboard automáticamente
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(
        auth,
        emailRef.current.value,
        passRef.current.value
      );
      // No navegues aquí, el useEffect lo hace automáticamente cuando AuthContext detecta el usuario
    } catch {
      setError('Usuario o contraseña inválidos');
    }
  }

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      {error && <p className="login-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Correo
          <input type="email" ref={emailRef} required />
        </label>
        <label>
          Contraseña
          <input type="password" ref={passRef} required />
        </label>
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}
