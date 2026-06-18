import { attachAudit } from "./audit.js";
import { extractSelector, isNativeTransfer, normalizeHex, normalizeList } from "./selectors.js";
import type { HarnessDecision, HarnessPolicy, HarnessVerdict, MatchedRule, RiskLevel, TransactionRequest } from "./types.js";

function pushRule(
  matchedRules: MatchedRule[],
  reasons: string[],
  rule: string,
  effect: HarnessDecision,
  detail: string
): void {
  matchedRules.push({ rule, effect, detail });
  reasons.push(detail);
}

function decide(matchedRules: MatchedRule[]): HarnessDecision {
  if (matchedRules.some((rule) => rule.effect === "deny")) {
    return "deny";
  }

  if (matchedRules.some((rule) => rule.effect === "review")) {
    return "review";
  }

  return "allow";
}

function riskLevelFor(verdict: HarnessDecision): RiskLevel {
  if (verdict === "deny") {
    return "high";
  }

  if (verdict === "review") {
    return "medium";
  }

  return "low";
}

function requiredActionsFor(verdict: HarnessDecision): string[] {
  if (verdict === "deny") {
    return ["Do not sign or broadcast this transaction."];
  }

  if (verdict === "review") {
    return ["Request human approval or higher-trust policy review before signing."];
  }

  return [];
}

function assertUintString(value: string, field: string): bigint {
  if (!/^[0-9]+$/.test(value)) {
    throw new Error(`${field} must be a non-negative integer string`);
  }

  return BigInt(value);
}

export function evaluateTransaction(request: TransactionRequest, policy: HarnessPolicy): HarnessVerdict {
  const matchedRules: MatchedRule[] = [];
  const reasons: string[] = [];
  const to = normalizeHex(request.to);
  const valueWei = assertUintString(request.valueWei, "request.valueWei");

  if (!policy.allowedChainIds.includes(request.chainId)) {
    pushRule(
      matchedRules,
      reasons,
      "chain.allowed",
      "deny",
      `Chain ${request.chainId} is not in the allowed chain list.`
    );
  } else {
    pushRule(matchedRules, reasons, "chain.allowed", "allow", `Chain ${request.chainId} is allowed.`);
  }

  const deniedAddresses = normalizeList(policy.deniedAddresses);
  if (deniedAddresses.has(to)) {
    pushRule(matchedRules, reasons, "address.denied", "deny", `Recipient ${request.to} is explicitly denied.`);
  }

  const allowedAddresses = normalizeList(policy.allowedAddresses);
  if (allowedAddresses.size > 0 && !allowedAddresses.has(to)) {
    pushRule(matchedRules, reasons, "address.allowed", "review", `Recipient ${request.to} is not allowlisted.`);
  } else if (allowedAddresses.size > 0) {
    pushRule(matchedRules, reasons, "address.allowed", "allow", `Recipient ${request.to} is allowlisted.`);
  }

  if (policy.maxValueWeiPerTx !== undefined) {
    const maxValueWeiPerTx = assertUintString(policy.maxValueWeiPerTx, "policy.maxValueWeiPerTx");
    if (valueWei > maxValueWeiPerTx) {
      pushRule(
        matchedRules,
        reasons,
        "value.per_tx",
        "deny",
        `Value ${request.valueWei} wei exceeds per-transaction limit ${policy.maxValueWeiPerTx} wei.`
      );
    } else {
      pushRule(
        matchedRules,
        reasons,
        "value.per_tx",
        "allow",
        `Value ${request.valueWei} wei is within per-transaction limit.`
      );
    }
  }

  if (policy.remainingDailyValueWei !== undefined) {
    const remainingDailyValueWei = assertUintString(policy.remainingDailyValueWei, "policy.remainingDailyValueWei");
    if (valueWei > remainingDailyValueWei) {
      pushRule(
        matchedRules,
        reasons,
        "value.daily_remaining",
        "deny",
        `Value ${request.valueWei} wei exceeds remaining daily budget ${policy.remainingDailyValueWei} wei.`
      );
    }
  }

  const selector = extractSelector(request.data);
  if (isNativeTransfer(request.data)) {
    if (policy.allowNativeTransfers === false) {
      pushRule(matchedRules, reasons, "native_transfer", "deny", "Native transfers are disabled by policy.");
    } else {
      pushRule(matchedRules, reasons, "native_transfer", "allow", "Native transfer is allowed by policy.");
    }
  } else if (selector === null) {
    pushRule(matchedRules, reasons, "calldata.selector", "review", "Calldata does not contain a valid function selector.");
  } else {
    const reviewSelectors = normalizeList(policy.reviewSelectors);
    const allowedSelectors = normalizeList(policy.allowedSelectors);

    if (reviewSelectors.has(selector)) {
      pushRule(matchedRules, reasons, "selector.review", "review", `Selector ${selector} requires review.`);
    } else if (allowedSelectors.has(selector)) {
      pushRule(matchedRules, reasons, "selector.allowed", "allow", `Selector ${selector} is allowed.`);
    } else {
      pushRule(
        matchedRules,
        reasons,
        "selector.unknown",
        policy.unknownCalldata,
        `Selector ${selector} is unknown; policy is ${policy.unknownCalldata}.`
      );
    }
  }

  const verdict = decide(matchedRules);
  const result = {
    verdict,
    riskLevel: riskLevelFor(verdict),
    reasons,
    matchedRules,
    requiredActions: requiredActionsFor(verdict)
  };

  return attachAudit(result, request, policy.name);
}
