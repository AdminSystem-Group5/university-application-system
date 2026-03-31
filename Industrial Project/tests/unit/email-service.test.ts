import { describe, expect, it } from "vitest";
import { buildApplicationSubmittedEmail, buildDecisionEmail } from "@/lib/email-service";

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
});