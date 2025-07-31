"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getAuthClient } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    console.log('AuthProvider: useEffect mount');
    getAuthClient().then(auth => {
      console.log('AuthProvider: getAuthClient resolved', auth);
      if (!auth) return;
      unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('AuthProvider: onAuthStateChanged', user);
        setUser(user);
        setLoading(false);
      });
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 