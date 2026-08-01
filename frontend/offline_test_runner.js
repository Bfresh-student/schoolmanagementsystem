// offline_test_runner.js
// Simple Node script to verify Dexie offline‑queue logic.
// Run with: node --experimental-modules offline_test_runner.js

import { db } from "./db.js";
import { saveData } from "./apiManager.js";
import { processOutboxQueue } from "./syncWorker.js";

// Helper: mock global fetch
function mockFetchSuccess(serverResponse) {
  global.fetch = async (url, opts) => {
    return {
      ok: true,
      json: async () => serverResponse,
    };
  };
}

function mockFetchFail() {
  global.fetch = async () => {
    throw new Error("Network offline");
  };
}

async function run() {
  console.log("=== Offline‑First Dexie test start ===");
  // Clean DB first
  await db.leads.clear();
  await db.outbox.clear();

  const payload = { name: "Test User", email: "test@example.com", status: "new" };

  // 1️⃣ Simulate offline: fetch fails, request should go to outbox
  mockFetchFail();
  await saveData("leads", "POST", payload);
  let outboxCount = await db.outbox.count();
  console.log("After offline save, outbox count:", outboxCount);
  if (outboxCount !== 1) throw new Error("Outbox should contain 1 entry after offline save");

  // 2️⃣ Simulate back online: fetch succeeds, process queue
  const serverRecord = { id: 123, name: "Test User", email: "test@example.com", status: "new" };
  mockFetchSuccess(serverRecord);
  await processOutboxQueue();
  outboxCount = await db.outbox.count();
  const lead = await db.leads.get(123);
  console.log("After sync, outbox count:", outboxCount, "lead from DB:", lead);
  if (outboxCount !== 0) throw new Error("Outbox should be empty after successful sync");
  if (!lead) throw new Error("Lead record was not stored after sync");

  console.log("✅ All checks passed!");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
