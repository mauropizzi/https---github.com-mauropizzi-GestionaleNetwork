"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionContextProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Login() {
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      router.push("/dashboard");
    }
  }, [session, loading, router]);

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
          providers={["google"]}
          redirectTo={process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000/dashboard"}
          localization={{
            variables: {
              sign_in: {
                email_input_label: "Indirizzo Email",
                password_input_label: "Password",
                button_label: "Accedi",
                social_auth_button_text: "Accedi con {{provider}}",
                // link_text: "Hai già un account? Accedi", // Removed as it's not a standard supported property
              },
              sign_up: {
                email_input_label: "Indirizzo Email",
                password_input_label: "Crea una Password",
                button_label: "Registrati",
                social_auth_button_text: "Registrati con {{provider}}",
                // link_text: "Non hai un account? Registrati", // Removed as it's not a standard supported property
              },
              forgotten_password: {
                email_input_label: "Indirizzo Email",
                button_label: "Invia istruzioni per il reset",
                // link_text: "Hai dimenticato la password?", // Removed as it's not a standard supported property
              },
              update_password: {
                password_input_label: "Nuova Password",
                button_label: "Aggiorna Password",
              },
              magic_link: {
                email_input_label: "Indirizzo Email",
                button_label: "Invia Magic Link",
                // link_text: "Invia un magic link", // Removed as it's not a standard supported property
              },
              verify_otp: {
                email_input_label: "Indirizzo Email",
                phone_input_label: "Numero di Telefono",
                token_input_label: "Codice OTP",
                button_label: "Verifica OTP",
                // link_text: "Hai già un account? Accedi", // Removed as it's not a standard supported property
              },
            },
          }}
        />
      </div>
    </div>
  );
}