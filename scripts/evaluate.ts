import { readFile } from "node:fs/promises";
import { evaluateTransaction } from "../src/index.js";
import type { HarnessPolicy, TransactionRequest } from "../src/index.js";

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function main(): Promise<void> {
  const [, , requestPath, policyPath] = process.argv;

  if (!requestPath || !policyPath) {
    throw new Error("Usage: npm run evaluate -- <request.json> <policy.json>");
  }

  const request = await readJson<TransactionRequest>(requestPath);
  const policy = await readJson<HarnessPolicy>(policyPath);
  const verdict = evaluateTransaction(request, policy);

  console.log(JSON.stringify(verdict, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
