import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai'

// Initialize Supabase with service role for admin access (bypassing RLS for cron job)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Use anon key as fallback if service is missing for some reason during local dev
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: NextRequest) {
    // 1. Verify Authentication
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // In local dev, we might not have a CRON_SECRET set up initially, or we might want to bypass it for easier testing
    // but in production on Vercel, this is strictly enforced.
    // Allow standard Authorization: Bearer <secret>
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Also check if they passed it as a simple X-Cron-Secret header just in case they are querying it directly
        if (req.headers.get('X-Cron-Secret') !== cronSecret) {
            console.error('Unauthorized cron request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('Starting daily chat analysis...');
        
        // 2. Fetch Sessions from the last 24 hours that are completed
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: sessions, error: sessionError } = await supabase
            .from('chat_sessions')
            .select('id, user_name, initial_issue, status, created_at')
            .gte('updated_at', twentyFourHoursAgo)
            .in('status', ['resolved', 'closed', 'active', 'open']) // We analyze all recent ones regardless of final closure but preference resolved/closed

        if (sessionError) {
            console.error('Error fetching sessions:', sessionError);
            return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
        }

        if (!sessions || sessions.length === 0) {
            console.log('No recent sessions to analyze.');
            return NextResponse.json({ message: 'No recent sessions to analyze' }, { status: 200 });
        }

        console.log(`Found ${sessions.length} sessions to analyze.`);

        // 3. For each session, fetch messages to build a transcript
        const transcriptsToAnalyze: string[] = [];

        for (const session of sessions) {
            const { data: messages, error: messagesError } = await supabase
                .from('chat_messages')
                .select('sender_type, message_content, created_at')
                .eq('session_id', session.id)
                .order('created_at', { ascending: true });

            if (messagesError) {
                console.error(`Error fetching messages for session ${session.id}:`, messagesError);
                continue;
            }

            if (messages && messages.length > 0) {
                let transcript = `Session Topic/Issue: ${session.initial_issue || 'Unknown'}\n\n`;
                for (const msg of messages) {
                    transcript += `[${msg.sender_type.toUpperCase()}]: ${msg.message_content}\n`;
                }
                transcriptsToAnalyze.push(transcript);
            }
        }

        if (transcriptsToAnalyze.length === 0) {
             return NextResponse.json({ message: 'No messages found in recent sessions' }, { status: 200 });
        }

        // 4. Use LLM to analyze transcripts
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY is not configured');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        const systemPrompt = `You are a helpful data analyst reviewing recent customer support chat transcripts.
Your goal is to identify common topics/issues discussed and flag any completely unanswered questions from users that should be added to our knowledge base.

Analyze the provided chat transcripts and output a JSON array of extracted topics.
Ensure the output conforms exactly to the JSON schema.
A topic should be concise (2-5 words, e.g., "Password Reset", "Screen Replacement Request", "Payment Failure").
If a user asked a specific question that the agent or bot failed to answer adequately, flag it with is_unanswered=true and include the specific question in the topic string (e.g., "Unanswered: How to pair bluetooth headphones").`;

        const responseSchema: Schema = {
            type: SchemaType.ARRAY,
            description: "List of extracted topics and unanswered questions.",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    topic: {
                        type: SchemaType.STRING,
                        description: "A concise label for the topic discussed, or the specific unanswered question.",
                    },
                    is_unanswered: {
                        type: SchemaType.BOOLEAN,
                        description: "True if this represents a question the user asked that was never adequately answered by the agent/bot.",
                    }
                },
                required: ["topic", "is_unanswered"]
            }
        };

        const model = genAI.getGenerativeModel({
            model: 'gemini-flash-latest',
            systemInstruction: systemPrompt,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        // We combine the transcripts for a single prompt to save tokens, separating them clearly.
        const promptParams = transcriptsToAnalyze.map((t, i) => `--- Transcript ${i+1} ---\n${t}\n`).join('\n');
        
        console.log('Sending transcripts to LLM for analysis...');
        const result = await model.generateContent(promptParams);
        const responseText = result.response.text();
        
        // Parse the JSON
        let extractedTopics: { topic: string, is_unanswered: boolean }[] = [];
        try {
            extractedTopics = JSON.parse(responseText);
            console.log(`Extracted ${extractedTopics.length} topics from AI analysis.`);
        } catch (e) {
            console.error('Failed to parse AI response as JSON:', responseText);
            return NextResponse.json({ error: 'LLM returned invalid format' }, { status: 500 });
        }

        // 5. Update kb_topics_backlog
        let addedCount = 0;
        let incrementedCount = 0;

        for (const item of extractedTopics) {
            try {
                // Normalize topic for comparison
                const normalizedTopic = item.topic.trim().toLowerCase();
                
                // For simplicity, we search with ilike
                const { data: existingTopic, error: findError } = await supabase
                    .from('kb_topics_backlog')
                    .select('id, frequency')
                    .ilike('topic', normalizedTopic)
                    .maybeSingle();

                if (findError) {
                    console.error('Error finding topic in backlog:', findError);
                    continue;
                }

                if (existingTopic) {
                    // Increment frequency
                    const { error: updateError } = await supabase
                        .from('kb_topics_backlog')
                        .update({ frequency: (existingTopic.frequency || 0) + 1 })
                        .eq('id', existingTopic.id);
                    
                    if (updateError) {
                       console.error('Error updating topic frequency:', updateError);
                    } else {
                        incrementedCount++;
                    }
                } else {
                    // Insert new
                    let finalTopicText = item.topic.trim();
                    // Just to be sure the is_unanswered is visible in the text 
                    // if it wasn't already prepended by the AI
                    if (item.is_unanswered && !finalTopicText.toLowerCase().includes("unanswered")) {
                        finalTopicText = `Unanswered: ${finalTopicText}`;
                    }

                    const { error: insertError } = await supabase
                        .from('kb_topics_backlog')
                        .insert({
                            topic: finalTopicText,
                            source: 'chat',
                            frequency: 1,
                            status: 'pending' // Default status
                        });
                        
                    if (insertError) {
                         console.error('Error inserting new topic:', insertError);
                    } else {
                         addedCount++;
                    }
                }
            } catch (innerError) {
                console.error(`Error processing topic "${item.topic}":`, innerError);
            }
        }

        console.log(`Knowledge Base update complete. Added: ${addedCount}, Incremented: ${incrementedCount}`);

        // 6. Process Device Health Alerts
        console.log('Processing device health alerts...');
        const alertResults = await processDeviceHealthAlerts();

        return NextResponse.json({
            success: true,
            message: `Cron task complete.`,
            kb_stats: { new_topics: addedCount, incremented_topics: incrementedCount },
            alert_stats: alertResults
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error during cron analysis:', error);
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
