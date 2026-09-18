import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

console.log("[HOSTINGER] Bootstrap started");
console.log("[HOSTINGER] cwd:", process.cwd());

const candidates = [
  path.resolve("dist/server.mjs"),
  path.resolve("server.mjs"),
];

console.log(
  "[HOSTINGER] Candidate files:",
  candidates.map((file) => ({
    file,
    exists: fs.existsSync(file),
  }))
);

try {
  const serverFile = candidates.find((file) => fs.existsSync(file));

  if (!serverFile) {
    console.error("[HOSTINGER] server.mjs not found in expected locations");
    console.log("[HOSTINGER] Root files:", fs.readdirSync(process.cwd()));
    process.exit(1);
  }

  console.log("[HOSTINGER] Loading:", serverFile);

  await import(pathToFileURL(serverFile).href);
} catch (error) {
  console.error("[HOSTINGER] Server import failed");
  console.error("[HOSTINGER] Error name:", error?.name);
  console.error("[HOSTINGER] Error message:", error?.message);
  console.error("[HOSTINGER] Error stack:", error?.stack);

  // stdout too, in case Hostinger hides some stderr entries
  console.log("[HOSTINGER ERROR]", String(error));

  process.exit(1);
}