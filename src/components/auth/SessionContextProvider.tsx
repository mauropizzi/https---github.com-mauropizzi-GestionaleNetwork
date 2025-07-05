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

export function SessionContextProvider({ children }: { ReactNode }) {
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

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Attempt to fetch user profile to ensure it exists
          if (session?.user) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code === 'PGRST116') { // PGRST116 means no rows returned (profile not found)
              console.warn("User profile not found for existing session. Signing out to clear stale session.");
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
            } else if (profileError) {
              console.error("Error fetching user profile during auth state change:", profileError);
              // Optionally sign out if there's a critical error fetching profile
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
            }
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          // Clear any user-specific data or redirect
          console.log("User signed out or deleted.");
          setSession(null);
          setUser(null);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);

      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          console.warn("User profile not found for initial session. Signing out to clear stale session.");
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } else if (profileError) {
          console.error("Error fetching user profile during initial session check:", profileError);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        }
      }
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