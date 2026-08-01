// syncWorker.js
import { db } from "./db.js";

/**
 * Process all pending outbox entries and send them to the Django backend.
 * Called from the Service Worker (background sync) or from a window `online`
 * event listener.
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
      // Remove from outbox on success
      await db.outbox.delete(req.id);
      // Update local leads store with server response (if not DELETE)
      if (req.method !== "DELETE") {
        const data = await resp.json();
        await db.leads.put(data);
      }
    } catch (e) {
      console.warn("Sync failed – will retry later", e);
      // Stop processing further items; they'll be retried on next sync
      break;
    }
  }
}
