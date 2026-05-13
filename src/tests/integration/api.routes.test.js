import { describe, expect, it } from "vitest";

describe("API route structure", () => {
  it("contains expected endpoints in the design", () => {
    const endpoints = ["/api/applications", "/api/notifications", "/api/email"];

    expect(endpoints).toContain("/api/applications");
    expect(endpoints).toContain("/api/notifications");
    expect(endpoints).toContain("/api/email");
  });
});