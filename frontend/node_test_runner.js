// node_test_runner.js
// Node script to test Dexie offline‑queue logic using Node‑compatible modules.

import { db } from "./dbNode.js";
import { saveData } from "./apiManagerNode.js";
import { processOutboxQueue } from "./syncWorkerNode.js";

// Mock fetch implementations
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
  console.log("=== Offline‑First Dexie test start (Node) ===");
  // Reset DB
  await db.leads.clear();
  await db.outbox.clear();

  const payload = { name: "Test User", email: "test@example.com", status: "new" };

  // 1️⃣ Offline simulation – request should be queued
  mockFetchFail();
  await saveData("leads", "POST", payload);
  let outboxCount = await db.outbox.count();
  console.log("Outbox after offline save:", outboxCount);
  if (outboxCount !== 1) throw new Error("Expected 1 outbox entry after offline save");

  // 2️⃣ Online simulation – process queue and store record
  const serverRecord = { id: 123, name: "Test User", email: "test@example.com", status: "new" };
  mockFetchSuccess(serverRecord);
  await processOutboxQueue();
  outboxCount = await db.outbox.count();
  const lead = await db.leads.get(123);
  console.log("Outbox after sync:", outboxCount, "Lead stored:", lead);
  if (outboxCount !== 0) throw new Error("Outbox should be empty after successful sync");
  if (!lead) throw new Error("Lead record not found after sync");

  console.log("✅ Node offline‑queue test passed!");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
