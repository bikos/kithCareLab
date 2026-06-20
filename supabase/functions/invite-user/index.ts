import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('Invite Request Received')
    // Debug logging to confirm secrets are present
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Secrets: URL or KEY is undefined')
      throw new Error('Server Config Error: Missing SUPABASE_URL or SERVICE_ROLE_KEY')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { email, name, firstName, lastName, organization_id } = await req.json()
    console.log('Inviting Email:', email)

    if (!email) {
      throw new Error('Email is required')
    }

    // Standard Supabase Invite
    const { data: user, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'http://localhost:8081/dashboard',
      data: {
        organization_id: organization_id,
        full_name: name, // Pass full name to user metadata
        first_name: firstName,
        last_name: lastName
      }
    })

    if (inviteError) {
      console.error('Supabase Invite Error:', inviteError)
      // Handle "User already registered" gracefully
      if (inviteError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ message: 'User already exists', sent: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw inviteError
    }

    return new Response(
      JSON.stringify({ user, sent: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge Function Exception:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
