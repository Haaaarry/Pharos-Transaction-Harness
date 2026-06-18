import { createHash } from "node:crypto";
import type { HarnessVerdict, TransactionRequest } from "./types.js";

export function createAuditId(request: TransactionRequest, policyName: string, verdict: string): string {
  const payload = JSON.stringify({
    chainId: request.chainId,
    from: request.from.toLowerCase(),
    to: request.to.toLowerCase(),
    valueWei: request.valueWei,
    data: request.data.toLowerCase(),
    policyName,
    verdict
  });

  return `harness_${createHash("sha256").update(payload).digest("hex").slice(0, 24)}`;
}

export function attachAudit(
  verdict: Omit<HarnessVerdict, "audit">,
  request: TransactionRequest,
  policyName: string
): HarnessVerdict {
  return {
    ...verdict,
    audit: {
      id: createAuditId(request, policyName, verdict.verdict),
      createdAt: new Date().toISOString(),
      policyName
    }
  };
}
