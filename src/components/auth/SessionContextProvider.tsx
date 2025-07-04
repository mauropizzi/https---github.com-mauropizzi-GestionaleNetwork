import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { showError } from "@/utils/toast";

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean; // Renamed from 'loading' to 'isLoading' for consistency
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        // The 'USER_DELETED' event is not part of the standard AuthChangeEvent type
        // from @supabase/supabase-js. Removing this comparison to resolve TS2367.
        // If user deletion needs to be handled, it should be done via database triggers
        // or a different mechanism that provides a compatible event type.
        // if (event === "USER_DELETED") {
        //   showError("Il tuo account è stato eliminato.");
        //   await supabase.auth.signOut();
        //   setSession(null);
        //   setUser(null);
        //   setIsLoading(false);
        //   return;
        // }

        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    // Initial session check
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user || null);
      })
      .catch((error) => {
        console.error("Error fetching session:", error);
        showError("Errore nel recupero della sessione.");
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, user, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
};