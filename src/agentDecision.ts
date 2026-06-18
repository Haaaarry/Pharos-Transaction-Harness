import type { HarnessVerdict } from "./types.js";

export type AgentAction = "proceed_to_executor" | "stop_and_request_human_review" | "blocked_no_broadcast";

export function decideAgentAction(verdict: HarnessVerdict): AgentAction {
  if (verdict.verdict === "allow") {
    return "proceed_to_executor";
  }

  if (verdict.verdict === "review") {
    return "stop_and_request_human_review";
  }

  return "blocked_no_broadcast";
}

export function primaryReasonFor(verdict: HarnessVerdict): string {
  if (verdict.verdict === "allow") {
    return "All policy checks passed; transaction may proceed to gated executor.";
  }

  const sameEffectRule = verdict.matchedRules.find((rule) => rule.effect === verdict.verdict && rule.detail);

  if (sameEffectRule?.detail) {
    return sameEffectRule.detail;
  }

  return verdict.reasons.at(-1) ?? "No reason";
}
