
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from delete-expired-users!")

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  
  if (!supabaseUrl || !supabaseServiceKey) {
     return new Response(JSON.stringify({ error: 'Missing environment variables' }), { status: 500 })
  }

  // Use Service Role to bypass RLS/Auth restrictions for the deletion
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 2. Call the Postgres function
    const { data, error } = await supabase.rpc('delete_old_users')

    if (error) {
      console.error('RPC Error:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    console.log('Cleanup Result:', data)
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: err + "" }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
