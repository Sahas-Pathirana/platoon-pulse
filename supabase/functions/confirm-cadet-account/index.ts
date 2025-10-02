import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConfirmCadetAccountRequest {
  authUserId: string
  cadetId: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { authUserId, cadetId } = await req.json() as ConfirmCadetAccountRequest

    if (!authUserId || !cadetId) {
      return new Response(
        JSON.stringify({ error: 'Auth user ID and cadet ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Confirm the email for the auth user
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      { email_confirm: true }
    )

    if (updateError) {
      console.error('Error confirming email:', updateError)
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create or update user profile with cadet linkage
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: authUserId,
        email: updateData.user.email,
        full_name: updateData.user.user_metadata?.full_name || '',
        role: 'student',
        cadet_id: cadetId,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error creating/updating user profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Confirmed account for user:', authUserId)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Cadet account confirmed and linked successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
