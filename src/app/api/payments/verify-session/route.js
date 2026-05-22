import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return NextResponse.json({ error: "Payment system not configured." }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });

  try {
    const { sessionId, applicationId } = await request.json();

    if (!sessionId || !applicationId) {
      return NextResponse.json({ error: "sessionId and applicationId are required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ success: false, status: session.payment_status }, { status: 402 });
    }

    if (session.metadata?.applicationId !== applicationId) {
      return NextResponse.json({ error: "Session does not match this application" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      applicationId,
      stripeSessionId: session.id,
      paymentIntentId: session.payment_intent || "",
      amountPence: session.amount_total || 0,
      currency: session.currency || "gbp",
    });
  } catch (error) {
    console.error("Verify session error:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
