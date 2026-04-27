import { buildDecisionEmail } from "@/lib/services/email-service";
import { sendEmailMock } from "@/functions/utils/smtpClient";
import { logEmailEvent } from "@/functions/triggers/logEmailEvent";

export function sendDecisionEmail(name, email, status) {
  const html = buildDecisionEmail(name, status);

  const smtpResult = sendEmailMock({
    to: email,
    subject: "Application Decision Update",
    html,
  });

  const logResult = logEmailEvent("decision", email);

  return {
    success: true,
    smtpResult,
    logResult,
  };
}