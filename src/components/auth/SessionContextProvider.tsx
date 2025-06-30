import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { showInfo, showError } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setSession(currentSession);
        if (location.pathname === '/login') {
          navigate('/'); // Redirect to home after login
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        if (location.pathname !== '/login' && !location.pathname.startsWith('/public')) {
          navigate('/login'); // Redirect to login if signed out and not on public/login page
          showInfo("Sei stato disconnesso. Effettua nuovamente l'accesso.");
        }
      } else if (event === 'INITIAL_SESSION') {
        setSession(currentSession);
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
      } else if (event === 'USER_DELETED') {
        setSession(null);
        navigate('/login');
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
      if (!initialSession && location.pathname !== '/login' && !location.pathname.startsWith('/public')) {
        navigate('/login');
      }
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

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