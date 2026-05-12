import { decisionTemplate } from "@/components/emails/decisionTemplate";
import { sendEmailMock } from "@/functions/utils/smtpClient";
import { logEmailEvent } from "@/functions/triggers/logEmailEvent";

export function sendDecisionEmail({
  name,
  email,
  status,
  messageToStudent,
}) {
  if (!email) {
    return {
      success: false,
      message: "No student email found. Decision email was not sent.",
    };
  }

  const html = decisionTemplate(name, status, messageToStudent);

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