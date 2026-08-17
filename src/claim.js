import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

export function findClaimPath(workspace, explicit) {
  if (explicit) {
    return isAbsolute(explicit) ? explicit : join(workspace, explicit);
  }
  const candidates = [
    join(workspace, ".workproof", "claim.json"),
    join(workspace, "claim.json"),
  ];
  return candidates.find((path) => existsSync(path)) ?? candidates[0];
}

export function loadClaim(workspace, explicit) {
  const path = findClaimPath(workspace, explicit);
  if (!existsSync(path)) {
    const error = new Error(`no claim file at ${path}`);
    error.code = "ENOCLAIM";
    error.path = path;
    throw error;
  }
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (cause) {
    const error = new Error(`claim is not valid JSON: ${path}`);
    error.code = "BADCLAIM";
    error.path = path;
    error.cause = cause;
    throw error;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    const error = new Error(`claim must be a JSON object: ${path}`);
    error.code = "BADCLAIM";
    error.path = path;
    throw error;
  }
  return { path, claim: raw };
}
