import { buildApplicationSubmittedEmail } from "@/lib/services/email-service";
import { sendEmailMock } from "@/functions/utils/smtpClient";
import { logEmailEvent } from "@/functions/triggers/logEmailEvent";

export function sendApplicationEmail(name, email) {
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