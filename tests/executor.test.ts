import { describe, expect, it } from "vitest";
import { executeIfAllowed } from "../src/index.js";
import type { HarnessPolicy, TransactionRequest } from "../src/index.js";

describe("executeIfAllowed", () => {
  it("blocks without broadcasting when verdict is not allow", async () => {
    const request: TransactionRequest = {
      chainId: 688688,
      from: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      to: "0x1111111111111111111111111111111111111111",
      valueWei: "200000000000000000",
      data: "0x"
    };

    const policy: HarnessPolicy = {
      name: "executor-test-policy",
      allowedChainIds: [688688],
      allowedAddresses: ["0x1111111111111111111111111111111111111111"],
      maxValueWeiPerTx: "100000000000000000",
      allowNativeTransfers: true,
      unknownCalldata: "review"
    };

    const result = await executeIfAllowed(request, policy, {
      rpcUrl: "http://127.0.0.1:1",
      privateKey: "0x59c6995e998f97a5a0044966f094538c7fb6c8755184ef1327b8a0fb0ec7eeef"
    });

    expect(result.verdict.verdict).toBe("deny");
    expect(result.execution.mode).toBe("blocked");
  });
});
