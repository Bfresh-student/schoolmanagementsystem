// apiManager.js
import { db } from "./db.js";

const DJANGO_API_URL = "https://gestion-scolaire-backend.onrender.com/api/v1";

/**
 * Save data locally and try to push to the Django API.
 * If offline or server error, the request is queued in the outbox.
 */
export async function saveData(endpoint, method, payload) {
  // Optimistic local write
  if (method === "POST") {
    await db.leads.add(payload);
  } else {
    await db.leads.put(payload);
  }

  const token = localStorage.getItem("authToken");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${DJANGO_API_URL}/${endpoint}/`;
  try {
    const resp = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error(`Server ${resp.status}`);
    const serverData = await resp.json();
    await db.leads.put(serverData);
    return serverData;
  } catch (err) {
    console.warn("Offline or server error – queueing request", err);
    await db.outbox.add({ url, method, payload, timestamp: Date.now(), token: token });
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register("sync-django-backend");
    }
  }
}
