import { applicationSubmittedTemplate } from "@/components/emails/applicationSubmittedTemplate";
import { decisionTemplate } from "@/components/emails/decisionTemplate";
import { registrationEmailTemplate } from "@/components/emails/registrationTemplate";

export function buildApplicationSubmittedEmail(name) {
  if (!name) throw new Error("Name is required");
  return applicationSubmittedTemplate(name);
}

export function buildDecisionEmail(name, status) {
  return decisionTemplate(name, status);
}

export function buildRegistrationEmail(name) {
  return registrationEmailTemplate(name);
}