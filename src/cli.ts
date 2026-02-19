#!/usr/bin/env node
import { createDelegation } from "./delegate.js";
import { Ability } from "@storacha/client/types";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  console.log(`
sacap - delegate account-level capabilities to server agents

usage:
  sacap <capability> <server-agent-did> <account-email> [options]

arguments:
  capability        the capability to delegate (e.g. plan/get, plan/*)
  server-agent-did  the DID of the agent you're delegating to
  account-email     the email associated with your storacha account

options:
  --expiry <days>   delegation expiry in days (default: 365)
  --help, -h        show this help message

examples:
  sacap plan/get did:key:z6Mk... alice@example.com
  sacap "plan/*" did:key:z6Mk... alice@example.com --expiry 30
`);
  process.exit(0);
}

const [capability, targetDID, email] = args;

if (!capability || !targetDID || !email) {
  console.error("missing arguments. run with --help for usage.");
  process.exit(1);
}

if (!targetDID.startsWith("did:key:")) {
  console.error("server-agent-did must be a did:key:... identifier");
  process.exit(1);
}

if (!email.includes("@")) {
  console.error("invalid email format");
  process.exit(1);
}

const expiryIdx = args.indexOf("--expiry");
const expiryDays = expiryIdx !== -1 ? parseInt(args[expiryIdx + 1], 10) : 365;

if (isNaN(expiryDays) || expiryDays <= 0) {
  console.error("--expiry must be a positive number");
  process.exit(1);
}

try {
  const proof = await createDelegation({
    capability: capability as Ability,
    targetDID,
    email,
    expiryDays,
  });

  console.log("\n--- DELEGATION (base64) ---");
  console.log(proof);
  console.log("--- END ---");
  console.log("\nset this as an environment variable on your server");
} catch (err) {
  console.error("\nerror:", (err as Error).message);
  process.exit(1);
}
