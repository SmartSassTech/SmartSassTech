import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role for admin access (bypassing RLS for cron job)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Use anon key as fallback if service is missing for some reason during local dev
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: NextRequest) {
    // 1. Verify Authentication
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        if (req.headers.get('X-Cron-Secret') !== cronSecret) {
            console.error('Unauthorized cron request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('Starting daily device health check...');

        // Process Device Health Alerts
        const alertResults = await processDeviceHealthAlerts();

        return NextResponse.json({
            success: true,
            message: `Cron task complete.`,
            alert_stats: alertResults
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error during cron job:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

async function processDeviceHealthAlerts() {
    let alertsSent = 0;
    let errors = 0;

    try {
        // Fetch devices with health issues
        // We join with user_devices and profiles. Note: profiles.id is auth.users.id
        const { data: healthIssues, error: fetchError } = await supabase
            .from('device_health_status')
            .select(`
                id,
                device_id,
                health_score,
                battery_status,
                update_status,
                device:user_devices (
                    device_name,
                    brand,
                    model,
                    user_id,
                    purchase_year
                )
            `)
            // We check all devices now because some might need upgrades based on age even if health is "ok"
            // .or('health_score.lt.50,battery_status.eq.replace,update_status.eq.outdated,update_status.eq.security_needed');

        if (fetchError) {
            console.error('Error fetching health issues:', fetchError);
            return { error: fetchError.message };
        }

        for (const issue of healthIssues) {
            const device = issue.device as any;
            if (!device || !device.user_id) continue;

            const userId = device.user_id;
            const deviceName = `${device.brand} ${device.model} (${device.device_name})`;

            // Check if we already sent a notification for this device in the last 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { data: existingNotif, error: notifError } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', userId)
                .eq('type', 'device_alert')
                .contains('metadata', { device_id: issue.device_id })
                .gte('created_at', thirtyDaysAgo)
                .maybeSingle();

            if (notifError) {
                console.error('Error checking existing notifications:', notifError);
                continue;
            }

            if (existingNotif) {
                console.log(`Skipping notification for ${deviceName}, already sent recently.`);
                continue;
            }

            // Determine alert details
            let title = '';
            let message = '';
            let alertType: 'device_alert' | 'maintenance' = 'device_alert';

            if (issue.update_status === 'security_needed') {
                title = 'Critical Security Update Needed';
                message = `Your ${deviceName} requires an urgent security update to protect your data. Please check your settings and install the latest patches.`;
            } else if (issue.update_status === 'outdated') {
                title = 'OS Update Available';
                message = `An OS update is available for your ${deviceName}. Keeping your software up to date ensures better performance and security.`;
                alertType = 'maintenance';
            } else if (issue.battery_status === 'replace') {
                title = 'Battery Replacement Recommended';
                message = `The battery health of your ${deviceName} has dropped significantly. We recommend replacing it soon to avoid unexpected shutdowns.`;
                alertType = 'maintenance';
            } else if (issue.health_score < 50) {
                title = 'Low Device Health Detected';
                message = `Our automated scan detected potential reliability issues with your ${deviceName} (Health Score: ${issue.health_score}). Consider scheduling a checkup.`;
            }

            // Additional Check: Device Upgrade Reminder (e.g., 5+ years old)
            const currentYear = new Date().getFullYear();
            if (!title && device.purchase_year && (currentYear - device.purchase_year) >= 5) {
                title = 'Device Upgrade Recommended';
                message = `Your ${deviceName} is now over 5 years old. To ensure you have access to the latest security features and performance improvements, you might want to consider an upgrade soon. Check out our latest recommendations!`;
                alertType = 'maintenance';
            }

            if (title && message) {
                // 1. Create notification in database
                const { error: insertError } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: userId,
                        type: alertType,
                        title: title,
                        message: message,
                        metadata: { device_id: issue.device_id, health_issue_id: issue.id }
                    });

                if (insertError) {
                    console.error('Error inserting notification:', insertError);
                    errors++;
                    continue;
                }

                // 2. Fetch user email
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email, first_name')
                    .eq('id', userId)
                    .single();

                if (profile?.email) {
                    // 3. Trigger email via Edge Function
                    try {
                        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-notification`;
                        await fetch(edgeFunctionUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
                            },
                            body: JSON.stringify({
                                type: 'notification',
                                user_email: profile.email,
                                user_name: profile.first_name || 'there',
                                title: title,
                                message: message,
                                notification_type: alertType
                            })
                        });
                        alertsSent++;
                    } catch (e) {
                         console.error('Error calling edge function:', e);
                         errors++;
                    }
                }
            }
        }

        return { alerts_sent: alertsSent, errors: errors };
    } catch (e: any) {
        console.error('Error in processDeviceHealthAlerts:', e);
        return { error: e.message };
    }
}
