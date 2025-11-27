import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    // Read raw body (required for signature)
    const rawBody = await req.text();

    // Verify webhook
    const event = resend.webhooks.verify({
      payload: rawBody,
      headers: {
        id: req.headers.get("svix-id"),
        timestamp: req.headers.get("svix-timestamp"),
        signature: req.headers.get("svix-signature"),
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    });

    // event = { type: "...", data: {...} }
    const { type, data } = event;

    // Build Discord message
    let message = `📨 **${type}**\n`;

    if (data?.to) message += `**To:** ${data.to}\n`;
    if (data?.from) message += `**From:** ${data.from}\n`;
    if (data?.subject) message += `**Subject:** ${data.subject}\n`;
    if (data?.reason) message += `**Reason:** ${data.reason}\n`;
    if (data?.id) message += `**Email ID:** ${data.id}\n`;

    // Send to Discord
    await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new NextResponse("Invalid webhook", { status: 400 });
  }
        }
