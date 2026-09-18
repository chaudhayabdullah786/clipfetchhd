console.log("[HOSTINGER] Bootstrap started");

try {
  await import("./server.mjs");
} catch (error) {
  console.error("[HOSTINGER] Server startup failed");
  console.error(error);
  process.exit(1);
}