import { applicationSubmittedTemplate } from "@/emails/applicationSubmittedTemplate";
import { decisionTemplate } from "@/emails/decisionTemplate";
import { registrationEmailTemplate } from "@/emails/registrationTemplate";

export function buildApplicationSubmittedEmail(name: string): string {
  return applicationSubmittedTemplate(name);
}

export function buildDecisionEmail(
  name: string,
  status: "Offer" | "Rejected" | "Under Review"
): string {
  return decisionTemplate(name, status);
}

export function buildRegistrationEmail(name: string): string {
  return registrationEmailTemplate(name);
}