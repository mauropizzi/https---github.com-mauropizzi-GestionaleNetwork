import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key to perform admin actions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }
    const jwt = authHeader.replace('Bearer ', '')

    // Verify the user making the request is an admin
    const { data: { user } } = await supabaseAdmin.auth.getUser(jwt)
    if (!user) {
      throw new Error('Invalid user token')
    }

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'Amministratore') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Only administrators can create users.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse the request body for new user data
    const { email, password, first_name, last_name, role } = await req.json()

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, role.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create the user using Supabase Admin API
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email for admin-created users
      user_metadata: {
        first_name: first_name || null,
        last_name: last_name || null,
      },
    })

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update the profile table with the specified role and allowed routes
    // The handle_new_user trigger will create the initial profile,
    // then we update it with the specific role and allowed_routes.
    const defaultAllowedRoutes = '[]' // Default empty array for new users
    let allowedRoutesForNewUser = defaultAllowedRoutes;

    // Define default allowed routes based on role
    if (role === 'Amministratore') {
      // Admins can access all routes, so we might not need to explicitly list them
      // Or, if we want to enforce explicit routes even for admins, list them all.
      // For simplicity, let's assume 'Amministratore' implies full access,
      // but we'll still store a default set if the client sends it.
      // The client-side form will send the selected routes.
    } else if (role === 'Amministrazione') {
      allowedRoutesForNewUser = '["/anagrafiche/clienti", "/anagrafiche/punti-servizio", "/anagrafiche/personale", "/anagrafiche/operatori-network", "/anagrafiche/fornitori", "/anagrafiche/tariffe", "/anagrafiche/procedure", "/servizi-a-canone", "/analisi-contabile", "/incoming-emails"]';
    } else if (role === 'Centrale Operativa') {
      allowedRoutesForNewUser = '["/", "/centrale-operativa", "/centrale-operativa/edit", "/incoming-emails"]';
    } else if (role === 'Personale esterno') {
      allowedRoutesForNewUser = '["/", "/centrale-operativa", "/service-request", "/service-list", "/dotazioni-di-servizio", "/registro-di-cantiere", "/richiesta-manutenzione"]';
    }

    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: role, allowed_routes: JSON.parse(allowedRoutesForNewUser) }) // Parse JSON string to jsonb
      .eq('id', newUser.user.id)

    if (updateProfileError) {
      console.error('Error updating new user profile:', updateProfileError);
      // Consider rolling back user creation if profile update is critical
      return new Response(JSON.stringify({ error: `User created but failed to set profile: ${updateProfileError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: 'User created successfully', userId: newUser.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in create-user function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})