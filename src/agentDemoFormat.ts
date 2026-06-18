import { primaryReasonFor, type AgentAction } from "./agentDecision.js";
import type { HarnessVerdict, TransactionRequest } from "./types.js";

export interface ScenarioBlockInput {
  index: number;
  total: number;
  scenarioName: string;
  request: TransactionRequest;
  verdict: HarnessVerdict;
  action: AgentAction;
}

const divider = "=".repeat(86);
const subDivider = "-".repeat(86);

function hintFor(verdict: HarnessVerdict): string {
  if (verdict.verdict === "allow") {
    return "policy pass; transaction may proceed to the gated executor.";
  }

  if (verdict.verdict === "review") {
    return "uncertain or sensitive call; agent must request human review.";
  }

  return "hard policy violation; transaction is blocked before broadcast.";
}

function gateFor(action: AgentAction): string {
  if (action === "proceed_to_executor") {
    return "OPEN - dry-run shows transaction would enter the gated executor";
  }

  return "CLOSED - executor is not called";
}

function summarizeCalldata(data: string): string {
  if (data.length <= 26) {
    return data;
  }

  const byteLength = Math.max(0, (data.length - 2) / 2);
  return `${data.slice(0, 10)}...${data.slice(-8)} (${byteLength} bytes)`;
}

export function formatScenarioBlock(input: ScenarioBlockInput): string {
  return [
    divider,
    `TRANSACTION ${input.index}/${input.total}: ${input.scenarioName}`,
    subDivider,
    `Intent:  ${input.request.intent ?? "No intent provided"}`,
    `Target:  ${input.request.to}`,
    `Value:   ${input.request.valueWei} wei`,
    `Calldata:${summarizeCalldata(input.request.data)}`,
    "",
    `Verdict: ${input.verdict.verdict.toUpperCase()}   Risk: ${input.verdict.riskLevel.toUpperCase()}`,
    `Hint: ${hintFor(input.verdict)}`,
    `Reason: ${primaryReasonFor(input.verdict)}`,
    "",
    `Action: ${input.action}`,
    `Gate: ${gateFor(input.action)}`,
    divider
  ].join("\n");
}
