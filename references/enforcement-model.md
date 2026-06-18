# Enforcement Model

The harness has three deployment levels.

## Level 1: Advisory Verdict

The agent asks for a verdict before it signs or broadcasts.

```text
Agent -> Harness -> verdict
Agent -> Wallet/RPC
```

This is useful for reusable Skill integration, but it does not stop a non-cooperative agent.

## Level 2: Reference Executor

The demo executor evaluates first and only broadcasts after `allow`.

```text
Agent -> Harness -> Executor -> RPC
```

This proves the control point can exist. It is still only a demo unless the runtime removes other signing and broadcast routes.

## Level 3: Enforced Runtime

All signer and RPC access sits behind the harness.

```text
Agent -> Harness -> Signer/RPC
```

This is the required shape for real control. The agent must not hold private keys, direct wallet handles, or unrestricted `sendRawTransaction` access.

## Recommended Hackathon Claim

Say:

> The Skill returns transaction policy verdicts and includes a reference executor that demonstrates gated execution.

Do not say:

> The Skill can forcibly stop any agent from trading.

That stronger claim is true only when the host runtime makes the harness the sole transaction gateway.
