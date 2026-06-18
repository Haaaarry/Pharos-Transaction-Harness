import { describe, expect, it } from "vitest";
import { formatScenarioBlock } from "../src/agentDemoFormat.js";
import type { AgentAction, HarnessVerdict, TransactionRequest } from "../src/index.js";

function request(): TransactionRequest {
  return {
    chainId: 688688,
    from: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    to: "0x1111111111111111111111111111111111111111",
    valueWei: "100",
    data: "0x",
    intent: "Pay an approved service provider inside the mission budget."
  };
}

function verdict(): HarnessVerdict {
  return {
    verdict: "deny",
    riskLevel: "high",
    reasons: ["Value exceeds per-transaction limit."],
    matchedRules: [
      {
        rule: "value.per_tx",
        effect: "deny",
        detail: "Value exceeds per-transaction limit."
      }
    ],
    requiredActions: ["Do not sign or broadcast this transaction."],
    audit: {
      id: "harness_test",
      createdAt: "2026-06-18T00:00:00.000Z",
      policyName: "test"
    }
  };
}

describe("formatScenarioBlock", () => {
  it("renders a separated transaction block with hints and gate result", () => {
    const output = formatScenarioBlock({
      index: 3,
      total: 3,
      scenarioName: "deny-over-budget",
      request: request(),
      verdict: verdict(),
      action: "blocked_no_broadcast" satisfies AgentAction
    });

    expect(output).toContain("TRANSACTION 3/3: deny-over-budget");
    expect(output).toContain("Hint: hard policy violation; transaction is blocked before broadcast.");
    expect(output).toContain("Gate: CLOSED - executor is not called");
    expect(output).toContain("Action: blocked_no_broadcast");
    expect(output).toContain("Reason: Value exceeds per-transaction limit.");
    expect(output.split("\n")[0]).toMatch(/^={8,}$/);
  });

  it("summarizes long calldata so screenshots stay readable", () => {
    const longRequest = request();
    longRequest.data = "0x123456780000000000000000000000000000000000000000000000000000000000000001";

    const output = formatScenarioBlock({
      index: 2,
      total: 3,
      scenarioName: "review-unknown-call",
      request: longRequest,
      verdict: verdict(),
      action: "stop_and_request_human_review"
    });

    expect(output).toContain("Calldata:0x12345678...00000001 (36 bytes)");
  });
});
