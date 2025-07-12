import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Obtenemos el documento de Firestore
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        const role = userSnap.exists() ? userSnap.data().role : null;
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role
        });
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
