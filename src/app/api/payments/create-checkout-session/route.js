import { NextResponse } from "next/server";
import Stripe from "stripe";

const FEE_PENCE = parseInt(process.env.STRIPE_APPLICATION_FEE_PENCE || "5000", 10);

export async function POST(request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return NextResponse.json(
      { error: "Payment system not configured. Please add STRIPE_SECRET_KEY to your environment." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10" });

  try {
    const body = await request.json();
    const { applicationId, studentId, universityName, courseName, studentEmail } = body;

    if (!applicationId || !studentId) {
      return NextResponse.json({ error: "applicationId and studentId are required" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: studentEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: FEE_PENCE,
            product_data: {
              name: "University Application Fee",
              description: `Application to ${universityName || "University"} — ${courseName || "Course"}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        applicationId,
        studentId,
      },
      success_url: `${appUrl}/student/application/${applicationId}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/student/application/${applicationId}/payment/cancel`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Stripe checkout session error:", error);
    return NextResponse.json({ error: error.message || "Failed to create payment session" }, { status: 500 });
  }
}
