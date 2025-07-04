"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Login() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      navigate("/");
    }
  }, [session, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (session) {
    return null; // Or a loading spinner, as the redirect will happen
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Accedi al tuo account</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "hsl(222.2 47.4% 11.2%)", // primary-foreground
                  brandAccent: "hsl(217.2 91.2% 59.8%)", // primary
                },
              },
            },
          }}
          providers={[]}
          redirectTo={window.location.origin}
          localization={{
            variables: {
              sign_in: {
                email_label: "Indirizzo Email",
                password_label: "Password",
                button_label: "Accedi",
                social_provider_text: "Accedi con {{provider}}",
                no_account: "Non hai un account? Registrati", // Added translation here
              },
              sign_up: {
                email_label: "Indirizzo Email",
                password_label: "Crea una Password",
                button_label: "Registrati",
                social_provider_text: "Registrati con {{provider}}",
              },
              forgotten_password: {
                email_label: "Indirizzo Email",
                button_label: "Invia istruzioni per il reset",
                link_text: "Hai dimenticato la password?",
              },
              update_password: {
                password_label: "Nuova Password",
                button_label: "Aggiorna Password",
              },
              magic_link: {
                email_input_label: "Indirizzo Email",
                button_label: "Invia Magic Link",
                link_text: "Invia un magic link",
              },
              verify_otp: {
                email_input_label: "Indirizzo Email",
                phone_input_label: "Numero di Telefono",
                token_input_label: "Codice OTP",
                button_label: "Verifica OTP",
              },
            },
          }}
        />
      </div>
    </div>
  );
}