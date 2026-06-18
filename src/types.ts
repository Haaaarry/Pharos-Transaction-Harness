export type HarnessDecision = "allow" | "deny" | "review";
export type RiskLevel = "low" | "medium" | "high";
export type UnknownCalldataMode = "allow" | "deny" | "review";

export interface TransactionRequest {
  chainId: number;
  from: string;
  to: string;
  valueWei: string;
  data: string;
  intent?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface HarnessPolicy {
  name: string;
  allowedChainIds: number[];
  allowedAddresses?: string[];
  deniedAddresses?: string[];
  maxValueWeiPerTx?: string;
  remainingDailyValueWei?: string;
  allowNativeTransfers?: boolean;
  allowedSelectors?: string[];
  reviewSelectors?: string[];
  unknownCalldata: UnknownCalldataMode;
}

export interface MatchedRule {
  rule: string;
  effect: HarnessDecision;
  detail?: string;
}

export interface HarnessVerdict {
  verdict: HarnessDecision;
  riskLevel: RiskLevel;
  reasons: string[];
  matchedRules: MatchedRule[];
  requiredActions: string[];
  audit: {
    id: string;
    createdAt: string;
    policyName: string;
  };
}

export interface PreparedVerdict {
  verdict: Omit<HarnessVerdict, "audit">;
  auditInput: {
    request: TransactionRequest;
    policyName: string;
  };
}
