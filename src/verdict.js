export function overallStatus(checks) {
  if (!checks.length) return "FAIL";
  if (checks.some((check) => check.status === "FAIL")) return "FAIL";
  if (checks.every((check) => check.status === "SKIP")) return "SKIP";
  return "PASS";
}

export function exitCodeFor(overall) {
  return overall === "FAIL" ? 1 : 0;
}

export function passedCount(checks) {
  return checks.filter((check) => check.status === "PASS").length;
}
