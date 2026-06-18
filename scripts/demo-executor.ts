import { readFile } from "node:fs/promises";
import { executeIfAllowed } from "../src/index.js";
import type { HarnessPolicy, TransactionRequest } from "../src/index.js";

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function main(): Promise<void> {
  const [, , requestPath, policyPath] = process.argv;

  if (!requestPath || !policyPath) {
    throw new Error("Usage: npm run demo:execute -- <request.json> <policy.json>");
  }

  const rpcUrl = process.env.PHAROS_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    throw new Error("Set PHAROS_RPC_URL and PRIVATE_KEY before running the demo executor.");
  }

  const request = await readJson<TransactionRequest>(requestPath);
  const policy = await readJson<HarnessPolicy>(policyPath);
  const result = await executeIfAllowed(request, policy, { rpcUrl, privateKey });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
