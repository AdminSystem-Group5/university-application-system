import { describe, expect, it } from "vitest";

function canMoveToNextStatus(currentStatus: string, nextStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    Submitted: ["Under Review"],
    "Under Review": ["Offer", "Rejected"],
    Offer: [],
    Rejected: [],
  };

  return validTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

describe("Application workflow", () => {
  it("allows Submitted to Under Review", () => {
    expect(canMoveToNextStatus("Submitted", "Under Review")).toBe(true);
  });

  it("allows Under Review to Offer", () => {
    expect(canMoveToNextStatus("Under Review", "Offer")).toBe(true);
  });

  it("blocks Submitted to Offer", () => {
    expect(canMoveToNextStatus("Submitted", "Offer")).toBe(false);
  });
});