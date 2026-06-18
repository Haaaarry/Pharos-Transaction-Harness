import { readFile } from "node:fs/promises";
import { decideAgentAction, evaluateTransaction, primaryReasonFor } from "../src/index.js";
import type { HarnessPolicy, TransactionRequest } from "../src/index.js";

interface Scenario {
  name: string;
  requestPath: string;
}

const scenarios: Scenario[] = [
  {
    name: "allow-transfer",
    requestPath: "examples/allow-transfer.request.json"
  },
  {
    name: "review-unknown-call",
    requestPath: "examples/review-unknown-call.request.json"
  },
  {
    name: "deny-over-budget",
    requestPath: "examples/deny-over-budget.request.json"
  }
];

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function main(): Promise<void> {
  const policy = await readJson<HarnessPolicy>("examples/policy.basic.json");

  console.log("Pharos Transaction Harness Agent Demo");
  console.log("Mode: dry-run agent simulation, no private key, no broadcast");
  console.log("");

  for (const scenario of scenarios) {
    const request = await readJson<TransactionRequest>(scenario.requestPath);
    const verdict = evaluateTransaction(request, policy);
    const action = decideAgentAction(verdict);

    console.log(`[Agent] Proposed transaction: ${scenario.name}`);
    console.log(`[Agent] Intent: ${request.intent ?? "No intent provided"}`);
    console.log(`[Harness] Verdict: ${verdict.verdict}`);
    console.log(`[Harness] Risk: ${verdict.riskLevel}`);
    console.log(`[Harness] Primary reason: ${primaryReasonFor(verdict)}`);
    console.log(`[Agent] Action: ${action}`);

    if (action === "proceed_to_executor") {
      console.log("[Executor] Dry-run: transaction would be sent to the gated executor.");
    } else {
      console.log("[Executor] Not called: harness verdict prevents broadcast.");
    }

    console.log("");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
