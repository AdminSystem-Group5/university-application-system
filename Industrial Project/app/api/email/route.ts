import { NextResponse } from "next/server";
import {
  buildApplicationSubmittedEmail,
  buildDecisionEmail,
  buildRegistrationEmail,
} from "@/lib/email-service";
import { logEmailEvent } from "../../../functions/src/triggers/logEmailEvent";
import { sendEmailMock } from "../../../functions/src/utils/smtpClient";

type EmailRequestBody = {
  type?: "submitted" | "decision" | "registration";
  name?: string;
  email?: string;
  status?: "Offer" | "Rejected" | "Under Review";
};

export async function POST(request: Request) {
  try {
    const body: EmailRequestBody = await request.json();

    if (!body.type || !body.name || !body.email) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: type, name, or email",
        },
        { status: 400 }
      );
    }

    let subject = "";
    let preview = "";

    if (body.type === "submitted") {
      subject = "Application Submitted";
      preview = buildApplicationSubmittedEmail(body.name);
    } else if (body.type === "registration") {
      subject = "Welcome to the System";
      preview = buildRegistrationEmail(body.name);
    } else {
      subject = "Application Decision Update";
      preview = buildDecisionEmail(body.name, body.status ?? "Under Review");
    }

    const smtpResult = sendEmailMock({
      to: body.email,
      subject,
      html: preview,
    });

    const logResult = logEmailEvent(body.type, body.email);

    return NextResponse.json({
      success: true,
      message: "Email processed successfully",
      preview,
      smtpResult,
      logResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process email request",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}