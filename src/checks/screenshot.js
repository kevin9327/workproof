import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MAGIC = [
  { kind: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { kind: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { kind: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { kind: "webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

export function detectImage(buffer) {
  for (const candidate of MAGIC) {
    if (candidate.bytes.every((byte, i) => buffer[i] === byte)) {
      return candidate.kind;
    }
  }
  return null;
}

export function checkScreenshot({ workspace, claim }) {
  const spec = claim?.screenshot;
  if (!spec || typeof spec.path !== "string" || spec.path.length === 0) {
    return {
      name: "screenshot",
      status: "SKIP",
      reason: "no screenshot cited",
    };
  }

  const required = spec.required !== false;
  const abs = join(workspace, spec.path);
  if (!existsSync(abs)) {
    if (!required) {
      return {
        name: "screenshot",
        status: "SKIP",
        reason: `no capture at ${spec.path}`,
      };
    }
    return {
      name: "screenshot",
      status: "FAIL",
      reason: `no capture at ${spec.path}`,
    };
  }

  let stat;
  try {
    stat = statSync(abs);
  } catch (error) {
    return {
      name: "screenshot",
      status: "FAIL",
      reason: `cannot stat capture: ${error.message}`,
    };
  }
  if (!stat.isFile() || stat.size === 0) {
    return {
      name: "screenshot",
      status: "FAIL",
      reason: `empty capture at ${spec.path}`,
    };
  }

  let buffer;
  try {
    buffer = readFileSync(abs);
  } catch (error) {
    return {
      name: "screenshot",
      status: "FAIL",
      reason: `cannot read capture: ${error.message}`,
    };
  }

  const kind = detectImage(buffer);
  if (!kind) {
    return {
      name: "screenshot",
      status: "FAIL",
      reason: `not an image: ${spec.path}`,
    };
  }

  return {
    name: "screenshot",
    status: "PASS",
    reason: `${kind} capture at ${spec.path}`,
    detail: { path: spec.path, kind, bytes: stat.size },
  };
}
