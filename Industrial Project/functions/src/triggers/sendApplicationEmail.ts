import { buildApplicationSubmittedEmail } from "@/lib/email-service";
import { sendEmailMock } from "@/functions/src/utils/smtpClient";
import { logEmailEvent } from "@/functions/src/triggers/logEmailEvent";

export function sendApplicationEmail(name: string, email: string) {
  const html = buildApplicationSubmittedEmail(name);

  const smtpResult = sendEmailMock({
    to: email,
    subject: "Application Submitted",
    html,
  });

  const logResult = logEmailEvent("submitted", email);

  return {
    success: true,
    smtpResult,
    logResult,
  };
}