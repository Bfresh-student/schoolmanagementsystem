// dbNode.js
// Node-compatible Dexie initialization for test environment

import "fake-indexeddb/auto";
import Dexie from "dexie";

export const db = new Dexie("PwaDatabase");
// stores: leads for app data, outbox for pending requests
db.version(1).stores({
  leads: "++id, name, email, status",
  outbox: "++id, url, method, payload, timestamp",
});
