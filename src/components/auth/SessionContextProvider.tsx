import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
// Removed useNavigate and useLocation from here
import { showInfo, showError } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Removed navigate and location hooks

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setSession(currentSession);
        // Removed navigation logic here
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        // Removed navigation logic here
        showInfo("Sei stato disconnesso. Effettua nuovamente l'accesso.");
      } else if (event === 'INITIAL_SESSION') {
        setSession(currentSession);
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
      } else if (event === 'USER_DELETED') {
        setSession(null);
        showError("Il tuo account è stato eliminato.");
      }
      setLoading(false);
    });

    // Fetch initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching initial session:", error);
        showError(`Errore nel recupero della sessione: ${error.message}`);
      }
      setSession(initialSession);
      setLoading(false);
      // Removed navigation logic here
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []); // Dependencies should be empty now as navigate/location are removed

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