console.log("[HOSTINGER] Bootstrap started");

try {
  await import("./dist/server.mjs");
} catch (error) {
  console.error("[HOSTINGER] Failed to load dist/server.mjs");
  console.error(error);
  process.exit(1);
}