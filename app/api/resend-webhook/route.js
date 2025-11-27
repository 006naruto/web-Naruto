// app/api/resend-webhook/route.js
import { Webhook } from 'svix';
import { NextResponse } from 'next/server';

// --- Environment Variables ---
// You must set these in your Vercel Project Settings
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

export async function POST(request) {
  // 1. Get the raw body and signature
  const payload = await request.text();
  const headers = request.headers;
  
  // Extract headers required for Svix verification
  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature || !RESEND_WEBHOOK_SECRET) {
    console.error("Missing Svix headers or webhook secret.");
    return NextResponse.json({ message: 'Missing security headers or secrets.' }, { status: 401 });
  }

  // 2. Verify the webhook signature using Svix
  let event;
  try {
    const wh = new Webhook(RESEND_WEBHOOK_SECRET);
    // This will throw an error if the signature is invalid
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error(`[Webhook Error] Verification failed: ${err.message}`);
    return NextResponse.json({ message: 'Verification failed.' }, { status: 401 });
  }

  // 3. Process the Event
  const eventType = event.type;
  const emailData = event.data;

  // We are only alerting for failures, bounces, and complaints
  if (eventType !== 'email.failed' && eventType !== 'email.bounced' && eventType !== 'email.complained') {
    return NextResponse.json({ message: `Event type ${eventType} ignored.` }, { status: 200 });
  }

  // 4. Format the Discord Payload
  const color = 15158332; // Red color for failures/bounces
  const discordPayload = {
    embeds: [{
      title: `❌ FAILED EMAIL ALERT: ${eventType.split('.')[1].toUpperCase()}`,
      description: `**To:** ${emailData.to.join(', ')}\n**Subject:** ${emailData.subject}`,
      color: color, 
      fields: [
        { name: "Recipient", value: emailData.to[0] || "N/A", inline: false },
        { name: "Event Type", value: eventType, inline: true },
        { name: "Reason", value: emailData.delivery_drop_reason || emailData.bounce_type || "Unknown", inline: true },
        { name: "Error Description", value: emailData.error_description || emailData.reason || "N/A", inline: false }
      ],
      footer: { text: `Resend ID: ${emailData.email_id}` },
      timestamp: new Date().toISOString(),
    }]
  };

  // 5. Send the message to Discord
  if (!DISCORD_WEBHOOK_URL) {
      console.error("Discord Webhook URL not configured");
      return NextResponse.json({ message: 'Discord Webhook URL not configured.' }, { status: 500 });
  }
  
  try {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
      });
      return NextResponse.json({ message: 'Webhook received and alert sent to Discord' }, { status: 200 });

  } catch (error) {
    console.error('Failed to send message to Discord:', error);
    return NextResponse.json({ message: 'Error forwarding to Discord.' }, { status: 500 });
  }
}
😎
