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
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Check if the user making the request is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser } } = await supabaseAdmin.auth.getUser(jwt)
    if (!requestingUser) {
      throw new Error('Invalid user token')
    }

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (profileError || !userProfile || userProfile.role !== 'Amministratore') {
      return new Response(JSON.stringify({ error: 'Unauthorized: User is not an admin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Get the new user details from the request body
    const { email, password, first_name, last_name, role, allowed_routes } = await req.json()

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, role' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Create the new user in auth.users
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // User will need to confirm their email
      user_metadata: {
        first_name: first_name,
        last_name: last_name,
      },
    })

    if (createUserError) {
      throw createUserError
    }

    if (!newUser || !newUser.user) {
        throw new Error("User creation did not return a user object.");
    }

    // The `handle_new_user` trigger will have already created a profile with default values.
    // 4. Update the newly created profile with the correct role and allowed routes.
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: role,
        allowed_routes: allowed_routes || [],
        // first_name and last_name are already set by the trigger via user_metadata
      })
      .eq('id', newUser.user.id)

    if (updateProfileError) {
      // If updating the profile fails, we should probably delete the auth user to avoid an inconsistent state.
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Failed to update profile for new user: ${updateProfileError.message}`);
    }

    return new Response(JSON.stringify({ message: 'User created successfully', user: newUser.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in create-user function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})