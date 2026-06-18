import { readFile } from "node:fs/promises";
import { decideAgentAction, evaluateTransaction, formatScenarioBlock } from "../src/index.js";
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
  console.log("Flow: Agent proposes tx -> Harness verdict -> Agent action -> Executor gate");
  console.log("");

  for (const [index, scenario] of scenarios.entries()) {
    const request = await readJson<TransactionRequest>(scenario.requestPath);
    const verdict = evaluateTransaction(request, policy);
    const action = decideAgentAction(verdict);

    console.log(formatScenarioBlock({
      index: index + 1,
      total: scenarios.length,
      scenarioName: scenario.name,
      request,
      verdict,
      action
    }));
    console.log("");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
