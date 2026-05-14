import { describe, expect, it } from "vitest";
import {
  buildApplicationSubmittedEmail,
  buildDecisionEmail,
  buildRegistrationEmail,
} from "@/lib/services/email-service";

describe("Email service", () => {
  it("builds application submitted email", () => {
    const html = buildApplicationSubmittedEmail("Andreea");
    expect(html).toContain("Andreea");
    expect(html).toContain("Application Submitted");
  });

  it("builds offer decision email", () => {
    const html = buildDecisionEmail("Andreea", "Offer");
    expect(html).toContain("Andreea");
    expect(html).toContain("received an offer");
  });

  it("builds registration email", () => {
    const html = buildRegistrationEmail("Andreea");
    expect(html).toContain("Andreea");
    expect(html).toContain("Welcome to the System");
  });
});