'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

const AuthCtx = createContext({ user: null, loading: true });

export default function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      // Fast boot from client storage; if none, user stays whatever initialUser was.
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) setUser(session.user);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
