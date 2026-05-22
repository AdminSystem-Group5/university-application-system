import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log(
      `Payment confirmed via webhook: applicationId=${session.metadata?.applicationId}, ` +
      `intent=${session.payment_intent}, amount=${session.amount_total}`
    );
  }

  return NextResponse.json({ received: true });
}
