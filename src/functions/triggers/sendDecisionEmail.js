import { buildDecisionEmail } from "@/lib/email-service";
import { sendEmailMock } from "@/functions/src/utils/smtpClient";
import { logEmailEvent } from "@/functions/src/triggers/logEmailEvent";

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