import { describe, expect, it } from "vitest";
import { evaluateTransaction } from "../src/index.js";
import type { HarnessPolicy, TransactionRequest } from "../src/index.js";

const basePolicy: HarnessPolicy = {
  name: "test-policy",
  allowedChainIds: [688688],
  allowedAddresses: ["0x1111111111111111111111111111111111111111"],
  deniedAddresses: ["0x9999999999999999999999999999999999999999"],
  maxValueWeiPerTx: "100000000000000000",
  remainingDailyValueWei: "500000000000000000",
  allowNativeTransfers: true,
  allowedSelectors: ["0xa9059cbb"],
  reviewSelectors: ["0x095ea7b3"],
  unknownCalldata: "review"
};

const baseRequest: TransactionRequest = {
  chainId: 688688,
  from: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  to: "0x1111111111111111111111111111111111111111",
  valueWei: "10000000000000000",
  data: "0x"
};

describe("evaluateTransaction", () => {
  it("allows an allowlisted native transfer within budget", () => {
    const verdict = evaluateTransaction(baseRequest, basePolicy);

    expect(verdict.verdict).toBe("allow");
    expect(verdict.riskLevel).toBe("low");
    expect(verdict.audit.id).toMatch(/^harness_[a-f0-9]{24}$/);
  });

  it("denies a transaction over the per-transaction budget", () => {
    const verdict = evaluateTransaction(
      {
        ...baseRequest,
        valueWei: "200000000000000000"
      },
      basePolicy
    );

    expect(verdict.verdict).toBe("deny");
    expect(verdict.requiredActions).toContain("Do not sign or broadcast this transaction.");
    expect(verdict.reasons.some((reason) => reason.includes("exceeds per-transaction limit"))).toBe(true);
  });

  it("denies a transaction to a denied address even when other rules pass", () => {
    const verdict = evaluateTransaction(
      {
        ...baseRequest,
        to: "0x9999999999999999999999999999999999999999"
      },
      {
        ...basePolicy,
        allowedAddresses: ["0x9999999999999999999999999999999999999999"]
      }
    );

    expect(verdict.verdict).toBe("deny");
    expect(verdict.reasons.some((reason) => reason.includes("explicitly denied"))).toBe(true);
  });

  it("reviews unknown calldata when policy requires review", () => {
    const verdict = evaluateTransaction(
      {
        ...baseRequest,
        data: "0x123456780000000000000000000000000000000000000000000000000000000000000001"
      },
      basePolicy
    );

    expect(verdict.verdict).toBe("review");
    expect(verdict.riskLevel).toBe("medium");
    expect(verdict.requiredActions).toContain("Request human approval or higher-trust policy review before signing.");
  });

  it("reviews known approval selector when policy flags it", () => {
    const verdict = evaluateTransaction(
      {
        ...baseRequest,
        data: "0x095ea7b30000000000000000000000001111111111111111111111111111111111111111"
      },
      basePolicy
    );

    expect(verdict.verdict).toBe("review");
    expect(verdict.reasons.some((reason) => reason.includes("requires review"))).toBe(true);
  });
});
