require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data, error, count } = await supabase
    .from('support_tickets')
    .select('*, profiles:user_id(first_name, last_name, email), agent:assigned_agent_id(first_name, last_name, email)', { count: 'exact' })
    .eq('user_id', '0b63d900-7c92-4c06-ba85-b1e0b44fa689')

  console.log('Error:', error)
  console.log('Count:', count)
  console.log('Data length:', data ? data.length : 0)
  if (data) {
     console.log('Sample item:', JSON.stringify(data[0], null, 2))
  }
}
test()
