// syncWorkerNode.js
// Node‑compatible sync worker for offline‑queue tests
import { db } from "./dbNode.js";

/**
 * Process all pending outbox entries and send them to the Django backend.
 * Used in Node test environment.
 */
export async function processOutboxQueue() {
  const pending = await db.outbox.toArray();
  if (!pending.length) return;
  console.info(`🔄 Syncing ${pending.length} queued request(s)…`);
  for (const req of pending) {
    try {
      const resp = await fetch(req.url, {
        method: req.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.payload)
      });
      if (!resp.ok) throw new Error(`Server ${resp.status}`);
      await db.outbox.delete(req.id);
      if (req.method !== "DELETE") {
        const data = await resp.json();
        await db.leads.put(data);
      }
    } catch (e) {
      console.warn("Sync failed – will retry later", e);
      break;
    }
  }
}
