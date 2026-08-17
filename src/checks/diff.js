import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function sameText(left, right) {
  return String(left).replaceAll("\r\n", "\n") === String(right).replaceAll("\r\n", "\n");
}

export function checkDiff({ workspace, claim }) {
  const files = claim?.diff?.files;
  if (!Array.isArray(files) || files.length === 0) {
    return {
      name: "diff",
      status: "FAIL",
      reason: "no claimed changes",
    };
  }

  const problems = [];
  let matched = 0;

  for (const file of files) {
    if (!file || typeof file.path !== "string" || file.path.length === 0) {
      problems.push("claimed file is missing a path");
      continue;
    }
    const op = file.op ?? "modify";
    const abs = join(workspace, file.path);
    const onDisk = existsSync(abs);

    if (op === "delete") {
      if (onDisk) {
        problems.push(`claimed delete but still on disk: ${file.path}`);
      } else {
        matched += 1;
      }
      continue;
    }

    if (op !== "add" && op !== "modify" && op !== "edit") {
      problems.push(`unknown op for ${file.path}: ${op}`);
      continue;
    }

    if (!onDisk) {
      problems.push(`claimed edit not on disk: ${file.path}`);
      continue;
    }

    let current;
    try {
      current = readFileSync(abs, "utf8");
    } catch (error) {
      problems.push(`cannot read ${file.path}: ${error.message}`);
      continue;
    }

    if (file.before !== undefined && sameText(current, file.before)) {
      problems.push(`file unchanged from before snapshot: ${file.path}`);
      continue;
    }
    if (typeof file.contains === "string" && !current.includes(file.contains)) {
      problems.push(`expected content not found: ${file.path}`);
      continue;
    }

    matched += 1;
  }

  if (problems.length) {
    return {
      name: "diff",
      status: "FAIL",
      reason: problems[0],
      detail: { matched, problems, claimed: files.length },
    };
  }

  const reason =
    matched === 1 ? "1 file matches claim" : `${matched} files match claim`;
  return {
    name: "diff",
    status: "PASS",
    reason,
    detail: { matched, claimed: files.length },
  };
}
