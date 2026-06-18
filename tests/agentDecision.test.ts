import { describe, expect, it } from "vitest";
import { decideAgentAction, primaryReasonFor } from "../src/agentDecision.js";
import type { HarnessVerdict } from "../src/index.js";

function verdict(value: HarnessVerdict["verdict"]): HarnessVerdict {
  return {
    verdict: value,
    riskLevel: value === "allow" ? "low" : value === "review" ? "medium" : "high",
    reasons: [],
    matchedRules: [],
    requiredActions: [],
    audit: {
      id: "harness_test",
      createdAt: "2026-06-18T00:00:00.000Z",
      policyName: "test"
    }
  };
}

describe("decideAgentAction", () => {
  it("routes allow verdicts to the executor path", () => {
    expect(decideAgentAction(verdict("allow"))).toBe("proceed_to_executor");
  });

  it("routes review verdicts to human review", () => {
    expect(decideAgentAction(verdict("review"))).toBe("stop_and_request_human_review");
  });

  it("blocks deny verdicts before broadcast", () => {
    expect(decideAgentAction(verdict("deny"))).toBe("blocked_no_broadcast");
  });

  it("selects the highest-impact matched rule as the primary reason", () => {
    const sample = verdict("deny");
    sample.matchedRules = [
      {
        rule: "chain.allowed",
        effect: "allow",
        detail: "Chain is allowed."
      },
      {
        rule: "value.per_tx",
        effect: "deny",
        detail: "Value exceeds per-transaction limit."
      },
      {
        rule: "native_transfer",
        effect: "allow",
        detail: "Native transfer is allowed."
      }
    ];

    expect(primaryReasonFor(sample)).toBe("Value exceeds per-transaction limit.");
  });

  it("summarizes allow verdicts as a successful policy pass", () => {
    expect(primaryReasonFor(verdict("allow"))).toBe("All policy checks passed; transaction may proceed to gated executor.");
  });
});
