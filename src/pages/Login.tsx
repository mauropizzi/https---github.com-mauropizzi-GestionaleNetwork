import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  // Reindirizza sempre alla radice dell'applicazione dopo il login
  const redirectToUrl = '/'; 

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">Accedi o Registrati</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Puoi aggiungere provider come 'google', 'github' qui
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light" // Puoi impostare 'dark' se la tua app supporta il tema scuro
          redirectTo={redirectToUrl} // Reindirizza alla root dopo il login
          localization={{
            variables: {
              common: {
                missing_email_or_phone: 'Email o telefono mancanti',
                loading: 'Caricamento...', // Added
                confirm_password_label: 'Conferma Password', // Added
                confirm_password_input_placeholder: 'Conferma la tua password', // Added
                full_name_label: 'Nome completo', // Added
                full_name_input_placeholder: 'Il tuo nome completo', // Added
                social_continue_with: 'Continua con {{provider}}', // Added
                back_to_sign_in: 'Torna all\'accesso', // Added
              },
              sign_in: {
                email_label: 'Indirizzo Email',
                password_label: 'La tua Password',
                email_input_placeholder: 'Il tuo indirizzo email',
                password_input_placeholder: 'La tua password',
                button_label: 'Accedi',
                link_text: 'Hai già un account? Accedi',
              },
              sign_up: {
                email_label: 'Indirizzo Email',
                password_label: 'Crea una Password',
                email_input_placeholder: 'Il tuo indirizzo email',
                password_input_placeholder: 'Crea la tua password',
                button_label: 'Registrati',
                link_text: 'Non hai un account? Registrati',
                confirmation_text: 'Controlla la tua email per il link di conferma',
              },
              forgotten_password: {
                email_label: 'Indirizzo Email',
                email_input_placeholder: 'Il tuo indirizzo email',
                button_label: 'Invia istruzioni per il reset',
                link_text: 'Hai dimenticato la password?',
              },
              update_password: {
                password_label: 'Nuova Password',
                password_input_placeholder: 'La tua nuova password',
                button_label: 'Aggiorna Password',
              },
              magic_link: {
                email_input_placeholder: 'Il tuo indirizzo email',
                button_label: 'Invia Magic Link',
                link_text: 'Invia un Magic Link',
              },
              verify_otp: {
                email_input_placeholder: 'Il tuo indirizzo email',
                phone_input_placeholder: 'Il tuo numero di telefono',
                button_label: 'Verifica OTP',
                link_text: 'Hai già un codice OTP? Verifica',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;