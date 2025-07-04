import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showInfo, showError } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('SessionContextProvider: Auth state changed!', { event, currentSession });
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') { // Group these events
        setSession(currentSession);
        console.log('SessionContextProvider: User SIGNED_IN, UPDATED, or TOKEN_REFRESHED. Session:', currentSession);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        console.log('SessionContextProvider: User SIGNED_OUT. Session is null.');
        showInfo("Sei stato disconnesso. Effettua nuovamente l'accesso.");
      } else if (event === 'INITIAL_SESSION') {
        setSession(currentSession);
        console.log('SessionContextProvider: Initial session loaded. Session:', currentSession);
      } else if (event === 'USER_DELETED') { // Keep USER_DELETED separate
        setSession(null);
        console.log('SessionContextProvider: User deleted. Session is null.');
        showError("Il tuo account è stato eliminato.");
      }
      setLoading(false);
    });

    // Fetch initial session
    const getInitialSession = async () => {
      console.log('SessionContextProvider: Fetching initial session...');
      const { data: { session: initialSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("SessionContextProvider: Error fetching initial session:", error);
        showError(`Errore nel recupero della sessione: ${error.message}`);
      }
      setSession(initialSession);
      setLoading(false);
      console.log('SessionContextProvider: Initial session fetch complete. Session:', initialSession);
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};