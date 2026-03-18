import 'dotenv/config'
import path from 'path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Explicitly load .env.local from the current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const emailsToDelete = [
  'bloomingdalemaddie@gmail.com',
  'bloomingdalemolly@gmail.com'
]

async function cleanup() {
  console.log('Starting cleanup of problematic test accounts...')
  
  for (const email of emailsToDelete) {
    try {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError

      const user = users.find(u => u.email === email)
      if (user) {
        console.log(`Found user ${email} (ID: ${user.id}). Deleting...`)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        if (deleteError) {
          console.error(`Failed to delete ${email}:`, deleteError.message)
        } else {
          console.log(`Successfully deleted ${email}.`)
        }
      } else {
        console.log(`User ${email} not found in Auth.`)
      }
    } catch (err: any) {
      console.error(`Error processing ${email}:`, err.message)
    }
  }
  
  console.log('Cleanup complete.')
}

cleanup()
