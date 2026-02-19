import { create } from "@storacha/client";
import { StoreConf } from "@storacha/client/stores/conf";
import { Ability, AccountDID } from "@storacha/client/types";
import { CAR, createLink, delegate, DID } from "@ucanto/core";
import { base64 } from "multiformats/bases/base64";
import { identity } from "multiformats/hashes/identity";

interface CreateDelegationOptions {
  capability: Ability;
  targetDID: string;
  email: string;
  expiryDays?: number;
}

/**
 * Creates an account-level delegation from the local Storacha CLI agent
 * to a target server agent.
 */
export async function createDelegation({
  capability,
  targetDID,
  email,
  expiryDays = 365,
}: CreateDelegationOptions): Promise<string> {
  const [user, domain] = email.split("@");
  if (!user || !domain) throw new Error("invalid email format");

  const accountDID: AccountDID = `did:mailto:${domain}:${user}`;

  // loads the storacha CLI agent from its local store which can be found at
  // ~/Library/Preferences/w3access/storacha-cli.json on macOS
  // ~/.config/w3access/storacha-cli.json on linux
  // %APPDATA%/w3access/storacha-cli.json on windows
  const store = new StoreConf({ profile: "storacha-cli" });
  const client = await create({ store });

  console.log("loaded agent:", client.did());
  console.log("account DID:", accountDID);
  console.log("capability:", capability);

  const proofs = client.proofs([{ can: capability, with: accountDID }]);
  console.log("proofs found:", proofs.length);

  if (proofs.length === 0) {
    throw new Error(
      `no proofs found for ${capability} on ${accountDID}.\n` +
        'make sure you have logged in with "storacha login" using this email',
    );
  }

  const result = await delegate({
    issuer: client.agent.issuer,
    audience: DID.parse(targetDID),
    capabilities: [{ can: capability, with: accountDID }],
    proofs,
    expiration: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * expiryDays,
  });

  const { ok: bytes, error } = await result.archive();
  if (error) throw new Error("failed to archive delegation: " + error.message);

  const cid = createLink(CAR.code, identity.digest(bytes!));
  return cid.toString(base64);
}
