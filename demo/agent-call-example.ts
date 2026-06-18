import { evaluateTransaction } from "../src/index.js";
import type { HarnessPolicy, TransactionRequest } from "../src/index.js";

const request: TransactionRequest = {
  chainId: 688688,
  from: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  to: "0x1111111111111111111111111111111111111111",
  valueWei: "10000000000000000",
  data: "0x",
  intent: "Pay an approved service provider inside the mission budget."
};

const policy: HarnessPolicy = {
  name: "demo-agent-policy",
  allowedChainIds: [688688],
  allowedAddresses: ["0x1111111111111111111111111111111111111111"],
  maxValueWeiPerTx: "100000000000000000",
  allowNativeTransfers: true,
  unknownCalldata: "review"
};

const verdict = evaluateTransaction(request, policy);

if (verdict.verdict !== "allow") {
  throw new Error(`Agent must stop: ${verdict.verdict}`);
}

console.log("Agent may continue to its configured signing path.");
console.log(JSON.stringify(verdict, null, 2));
