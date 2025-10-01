/// <reference types="https://deno.land/std@0.203.0/types.d.ts" />
// @deno-types="https://esm.sh/v135/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateCadetUserRequest {
  email: string
  password: string
  fullName: string
  cadetId: string
}

// Explicitly type the handler for Deno.serve
Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the request body
    const { email, password, fullName, cadetId }: CreateCadetUserRequest = await req.json()

    // Validate required fields
    if (!email || !password || !fullName || !cadetId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sanitize and validate fullName
    const sanitizedFullName = String(fullName).trim()
    if (sanitizedFullName.length === 0 || sanitizedFullName.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Full name must be between 1 and 100 characters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create the user account with email confirmation disabled
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: sanitizedFullName
      }
    })

    if (authError) {
      console.error('Auth error:', authError)

      // Handle case where email already exists: update password, confirm email, and link profile
      const status = (authError as any)?.status
      const code = (authError as any)?.code
      const message = (authError as any)?.message || String(authError)

      if (status === 422 && (code === 'email_exists' || /already been registered/i.test(message))) {
        // Try to find the existing user by listing users and matching the email
        try {
          let existingUser: any = null
          let page = 1
          const perPage = 100

          while (true) {
            const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
            if (listError) {
              console.error('List users error:', listError)
              break
            }
            const match = usersData?.users?.find((u: any) => (u.email || '').toLowerCase() === email.trim().toLowerCase())
            if (match) {
              existingUser = match
              break
            }
            if (!usersData?.users || usersData.users.length < perPage) {
              break
            }
            page++
          }

          if (!existingUser) {
            return new Response(
              JSON.stringify({ error: 'Email already registered and user lookup failed' }),
              {
                status: 409,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          // Update existing user password and metadata, confirm email
          const { error: updError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password,
            email_confirm: true,
            user_metadata: { full_name: sanitizedFullName }
          })

          if (updError) {
            console.error('Update existing user error:', updError)
            return new Response(
              JSON.stringify({ error: `Existing user found but password update failed: ${updError.message}` }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          // Ensure profile exists and link cadet
          const { error: profileUpsertError } = await supabaseAdmin
            .from('user_profiles')
            .upsert(
              {
                id: existingUser.id,
                email: existingUser.email ?? email.trim(),
                full_name: sanitizedFullName,
                role: 'student',
                cadet_id: cadetId,
              },
              { onConflict: 'id' }
            )

          if (profileUpsertError) {
            console.error('Profile upsert error:', profileUpsertError)
            return new Response(
              JSON.stringify({ error: `Profile linking failed: ${profileUpsertError.message}` }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          return new Response(
            JSON.stringify({
              success: true,
              message: 'Existing user linked and password set',
              user: {
                id: existingUser.id,
                email: existingUser.email ?? email.trim(),
              }
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        } catch (e: any) {
          console.error('Error handling existing email:', e)
          return new Response(
            JSON.stringify({ error: e?.message || 'Failed to handle existing email' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      }

      return new Response(
        JSON.stringify({ error: message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the user profile linking to the cadet
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
     .upsert(
        {
          id: authData.user.id,
          email: email.trim(),
          full_name: sanitizedFullName,
          role: 'student',
          cadet_id: cadetId,
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      console.error('Profile error:', profileError)
      
      // If profile creation fails, clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      
      return new Response(
        JSON.stringify({ error: `Profile creation failed: ${profileError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cadet account created successfully',
        user: { 
          id: authData.user.id, 
          email: authData.user.email 
        } 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error creating cadet user:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create user account' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})