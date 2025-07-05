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
    // Create a Supabase client with the service role key to manage users
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
    const { data: { user: requestingUser } } = await supabaseAdmin.auth.getUser(jwt)
    if (!requestingUser) {
      throw new Error('Invalid user token')
    }

    const { data: requestingUserProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single()

    if (profileError || !requestingUserProfile || requestingUserProfile.role !== 'Amministratore') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Only administrators can create users.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, password, first_name, last_name, role, allowed_routes } = await req.json()

    if (!email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, role.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create the user in Supabase Auth
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Automatically confirm email
      user_metadata: { first_name, last_name }, // Store in user_metadata for handle_new_user trigger
    })

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return new Response(JSON.stringify({ error: createUserError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update the user's profile with the specified role and allowed routes
    // The handle_new_user trigger will create a basic profile, then we update it.
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: first_name || null,
        last_name: last_name || null,
        role: role,
        allowed_routes: allowed_routes || [],
      })
      .eq('id', newUser.user.id)

    if (updateProfileError) {
      console.error('Error updating user profile:', updateProfileError);
      // Optionally delete the user if profile update fails to prevent orphaned users
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(JSON.stringify({ error: `User created but failed to update profile: ${updateProfileError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ message: 'User created and profile updated successfully', userId: newUser.user.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in create-user function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})