const statusEl = document.getElementById('status');

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : `http://${window.location.hostname}:8000`;

fetch(`${API_URL}/api/`)
  .then((res) => {
    if (res.ok) {
      statusEl.textContent = 'Backend connecté ✓';
    } else {
      statusEl.textContent = `Backend a répondu avec le statut ${res.status}`;
    }
  })
  .catch(() => {
    statusEl.textContent = 'Impossible de joindre le backend';
  });
