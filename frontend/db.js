// db.js
import Dexie from "https://cdn.jsdelivr.net/npm/dexie@4.0.1/dist/dexie.mjs";

export const db = new Dexie("PwaDatabase");
// Version 1 schema (legacy)
db.version(1).stores({
  leads: "++id, name, email, status",
  outbox: "++id, url, method, payload, timestamp"
});
// Version 2 adds token field to outbox for auth synchronization
db.version(2).stores({
  leads: "++id, name, email, status",
  outbox: "++id, url, method, payload, timestamp, token"
}).upgrade(async (tx) => {
  // Existing outbox entries will get undefined token; no action needed
});
