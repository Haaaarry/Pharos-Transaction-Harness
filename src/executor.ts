import { JsonRpcProvider, Wallet } from "ethers";
import { evaluateTransaction } from "./policy.js";
import type { HarnessPolicy, HarnessVerdict, TransactionRequest } from "./types.js";

export interface ExecutionResult {
  verdict: HarnessVerdict;
  execution:
    | {
        mode: "blocked";
        reason: string;
      }
    | {
        mode: "broadcast";
        txHash: string;
      };
}

export async function executeIfAllowed(
  request: TransactionRequest,
  policy: HarnessPolicy,
  options: {
    rpcUrl: string;
    privateKey: string;
  }
): Promise<ExecutionResult> {
  const verdict = evaluateTransaction(request, policy);

  if (verdict.verdict !== "allow") {
    return {
      verdict,
      execution: {
        mode: "blocked",
        reason: `Verdict is ${verdict.verdict}; executor refuses to broadcast.`
      }
    };
  }

  const provider = new JsonRpcProvider(options.rpcUrl);
  const wallet = new Wallet(options.privateKey, provider);
  const response = await wallet.sendTransaction({
    to: request.to,
    value: BigInt(request.valueWei),
    data: request.data
  });

  return {
    verdict,
    execution: {
      mode: "broadcast",
      txHash: response.hash
    }
  };
}
