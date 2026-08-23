// enrollment_api.js – helper to interact with the enrollment (inscriptions) API
// --------------------------------------------------------------
// Assumes a JWT access token is stored in localStorage under the key "accessToken".
// Adjust token storage/retrieval as needed for your auth flow.

const API_BASE = `${window.location.origin}/api/v1/enrollments`; // base path for enrollment endpoints

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/** Generic helper for fetch with proper error handling */
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const err = new Error(data?.detail || response.statusText);
    err.status = response.status;
    err.body = data;
    throw err;
  }
  return data;
}

// ------------------------------------------------------------------
// 1️⃣ List inscriptions (optionally with query params)
// ------------------------------------------------------------------
export async function listInscriptions(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE}/inscriptions/${query ? `?${query}` : ''}`;
  return request(url, { method: 'GET' });
}

// ------------------------------------------------------------------
// 2️⃣ Create a new inscription (online mode)
// ------------------------------------------------------------------
export async function createInscription(payload) {
  // payload should match the serializer fields, e.g. {student: 1, course: 2, ...}
  const url = `${API_BASE}/inscriptions/`;
  return request(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ------------------------------------------------------------------
// 3️⃣ Approve an inscription (admin/teacher action)
// ------------------------------------------------------------------
export async function approveInscription(id) {
  const url = `${API_BASE}/inscriptions/${id}/approve/`;
  return request(url, { method: 'POST' });
}

// ------------------------------------------------------------------
// 4️⃣ Reject an inscription (admin/teacher action)
// ------------------------------------------------------------------
export async function rejectInscription(id, reason) {
  const url = `${API_BASE}/inscriptions/${id}/reject/`;
  return request(url, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ------------------------------------------------------------------
// 5️⃣ Generic state transition (e.g. activate, suspend, validate)
// ------------------------------------------------------------------
export async function transitionInscription(id, newStatus) {
  const url = `${API_BASE}/inscriptions/${id}/transition/`;
  return request(url, {
    method: 'POST',
    body: JSON.stringify({ status: newStatus }),
  });
}

// ------------------------------------------------------------------
// 6️⃣ Sync a batch of offline‑created inscriptions
// ------------------------------------------------------------------
export async function syncInscriptionBatch(items) {
  // items = [{local_uuid: '…', student: 1, school_class: 3, ...}, ...]
  const url = `${API_BASE}/inscriptions/sync_batch/`;
  return request(url, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// ------------------------------------------------------------------
// Example usage (remove or adapt in production)
// ------------------------------------------------------------------
// (async () => {
//   try {
//     const pending = await listInscriptions({ status: 'pending' });
//     console.log('Pending inscriptions:', pending);
//   } catch (e) {
//     console.error('API error:', e);
//   }
// })();
