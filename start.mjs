console.log("[HOSTINGER] Bootstrap started");

// Hostinger runtime must always use the production server path.
// This prevents Vite development middleware from starting.
process.env.NODE_ENV = "production";

console.log("[HOSTINGER] NODE_ENV forced to:", process.env.NODE_ENV);

try {
  await import("./server.mjs");
} catch (error) {
  console.error("[HOSTINGER] Server startup failed");
  console.error(error);
  process.exit(1);
}