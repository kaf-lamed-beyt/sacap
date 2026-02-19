# sacap

**S**toracha **A**ccount **Cap**abilities — delegate account-level [Storacha](https://storacha.network) capabilities to server agents.

The Storacha CLI's `delegation create` command only supports space-scoped delegations (`did:key:...`). Some capabilities like `plan/get` are scoped to your account (`did:mailto:...`) and can't be delegated through the CLI. This tool handles that.

## Install

```bash
npm install -g sacap
```

### Prerequisites

- [Storacha CLI](https://www.npmjs.com/package/@storacha/cli) installed and logged in (`storacha login`)
- Email verification completed

## Usage

```bash
sacap <capability> <server-agent-did> <account-email> [--expiry <days>]
```

### Examples

```bash
# delegate plan/get to a server agent
sacap plan/get did:key:z6Mk... alice@example.com

# delegate all plan capabilities with a 30-day expiry
sacap "plan/*" did:key:z6Mk... alice@example.com --expiry 30
```

The output is a base64-encoded delegation string. Set it as an environment variable on your server.

### Loading the proof on your server

```typescript
import * as Proof from "@storacha/client/proof"

const planProof = await Proof.parse(process.env.STORACHA_PLAN_PROOF)
await client.addProof(planProof)
```

## Common pitfalls

### Wrong agent DID

The `server-agent-did` argument must be the DID of the agent that will **use** the delegation — not the CLI agent, not any other key. If the audience DID doesn't match, `addProof` will silently accept the delegation but the agent won't be able to use it.

If your server agent is created from a key in an environment variable (e.g. `STORACHA_KEY`. see: [bring your own delegations](https://docs.storacha.network/how-to/upload/#bring-your-own-delegations)), get its DID like this:

```typescript
import { Signer } from "@storacha/client/principal/ed25519"

const signer = Signer.parse(process.env.STORACHA_KEY)
console.log(signer.did()) // this is the DID you pass to sacap
```

Your local dev key and production key are likely different. Make sure you're delegating to the right one.

### Encoding format

It outputs a base64 identity CID — the same format as `storacha delegation create --base64`. Raw `Buffer.from(bytes).toString('base64')` won't work with `Proof.parse()`.

## How it works

1. Reads the local Storacha CLI agent store
2. Finds account-level proofs (the root `ucan:*` delegation from `did:mailto:...` + the attestation from the upload-service)
3. Creates a new UCAN delegation via `@ucanto/core` with the full proof chain
4. Exports as a base64 identity CID

## License

MIT
