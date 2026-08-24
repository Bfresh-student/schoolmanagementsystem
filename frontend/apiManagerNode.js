// apiManagerNode.js
// Node‑compatible API manager for offline‑queue tests
import { db } from "./dbNode.js";

const DJANGO_API_URL = "https://your-django-backend.com/api/v1"; // TODO: replace with real URL

/**
 * Save data locally and attempt to push to the Django API.
 * On failure, queue the request in the outbox for later sync.
 */
export async function saveData(endpoint, method, payload) {
  // Optimistic local write
  if (method === "POST") {
    await db.leads.add(payload);
  } else {
    await db.leads.put(payload);
  }

  const url = `${DJANGO_API_URL}/${endpoint}/`;
  try {
    const resp = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`Server ${resp.status}`);
    const serverData = await resp.json();
    await db.leads.put(serverData);
    return serverData;
  } catch (err) {
    console.warn("Offline or server error – queueing request", err);
    await db.outbox.add({ url, method, payload, timestamp: Date.now() });
    // In Node there is no Service Worker, so we just store in outbox.
  }
}