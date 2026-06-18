---
name: pharos-transaction-harness
description: Evaluate proposed Pharos agent transactions before execution. Use when an AI agent needs a policy verdict for on-chain transfers or contract calls, including allow/deny/review decisions, risk summaries, budget checks, selector checks, address allowlists, and reference executor gating for Pharos testnet transaction demos.
---

# Pharos Transaction Harness

Use this Skill before an agent signs or broadcasts a Pharos transaction.

The core output is a structured verdict:

- `allow`: the transaction fits policy.
- `deny`: the transaction violates a hard rule.
- `review`: the transaction needs human or higher-trust approval.

This Skill implements advisory policy evaluation and includes a reference executor demo. Hard enforcement requires the host runtime to route all signing and broadcast capability through the harness.

## Required Inputs

Read `schema/transaction-request.schema.json` and `schema/policy.schema.json` before integrating with an agent.

A transaction request includes:

- `chainId`
- `from`
- `to`
- `valueWei`
- `data`
- optional `intent`
- optional `metadata`

A policy includes:

- allowed chain IDs
- allowed and denied addresses
- per-transaction and daily value limits
- allowed and review-required function selectors
- unknown calldata behavior
- native transfer behavior

## Workflow

1. Validate the transaction request against `schema/transaction-request.schema.json`.
2. Validate policy against `schema/policy.schema.json`.
3. Call `evaluateTransaction(request, policy)`.
4. If `verdict` is `deny`, stop.
5. If `verdict` is `review`, request human or higher-trust approval.
6. If `verdict` is `allow`, the agent may continue.
7. If using the reference executor, broadcast only through `executeIfAllowed`.

## Execution Boundary

The default mode is advisory:

```text
Agent -> Harness verdict -> Agent or wallet decides whether to act
```

The demo executor shows a gated path:

```text
Agent -> Harness verdict -> Executor broadcasts only if verdict = allow
```

True enforcement requires runtime isolation:

```text
Agent -> Harness -> Signer/RPC
```

The agent must not have a separate signer, private key, or unrestricted `sendRawTransaction` path.

## Useful Files

- `schema/` defines machine-readable contracts.
- `examples/` contains allow, deny, and review requests.
- `src/policy.ts` contains the pure evaluator.
- `scripts/evaluate.ts` prints a verdict for a request and policy.
- `scripts/demo-executor.ts` demonstrates verdict-gated broadcasting.
- `references/enforcement-model.md` explains advisory versus enforced deployment.
