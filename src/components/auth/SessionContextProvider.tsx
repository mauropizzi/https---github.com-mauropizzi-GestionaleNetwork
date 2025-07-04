"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Extend AuthChangeEvent to include 'USER_DELETED' if it's a custom event or needed for specific logic
type ExtendedAuthChangeEvent = AuthChangeEvent | 'USER_DELETED';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionContextProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: ExtendedAuthChangeEvent, session: Session | null) => {
        console.log("Auth event:", event, "Session:", session);
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);

        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          // Clear any user-specific data or redirect
          console.log("User signed out or deleted.");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, user, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
}