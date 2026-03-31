import { applicationSubmittedTemplate } from "@/emails/applicationSubmittedTemplate";
import { decisionTemplate } from "@/emails/decisionTemplate";
import { registrationEmailTemplate } from "@/emails/registrationTemplate";

export function buildApplicationSubmittedEmail(name) {
  return applicationSubmittedTemplate(name);
}

export function buildDecisionEmail(name, status) {
  return decisionTemplate(name, status);
}

export function buildRegistrationEmail(name) {
  return registrationEmailTemplate(name);
}