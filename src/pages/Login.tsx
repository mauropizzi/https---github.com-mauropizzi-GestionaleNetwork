import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
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
          redirectTo={window.location.origin} // Reindirizza alla root dopo il login
        />
      </div>
    </div>
  );
};

export default Login;