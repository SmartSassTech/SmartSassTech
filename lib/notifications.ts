import { supabaseAdmin } from './supabase-admin'

export async function notifyAgents(title: string, message: string, type: 'general' | 'system' | 'device_alert' | 'points' | 'maintenance' = 'general', metadata: Record<string, any> = {}) {
  try {
    // 1. Get all agents and admins
    const { data: agents } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .in('role', ['agent', 'admin'])

    if (!agents || agents.length === 0) return

    // 2. Prepare notifications array
    const notifications = agents.map(agent => ({
      user_id: agent.id,
      title,
      message,
      type,
      metadata,
      sent_at: new Date().toISOString()
    }))

    // 3. Insert into Supabase
    await supabaseAdmin.from('notifications').insert(notifications)
  } catch (error) {
    console.error('Error in notifyAgents:', error)
  }
}

export async function notifyAgent(agentId: string, title: string, message: string, type: 'general' | 'system' | 'device_alert' | 'points' | 'maintenance' = 'general', metadata: Record<string, any> = {}) {
  if (!agentId) return;
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: agentId,
      title,
      message,
      type,
      metadata,
      sent_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in notifyAgent:', error)
  }
}
