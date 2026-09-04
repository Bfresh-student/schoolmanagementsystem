// sw-register.js
// Systematic Service Worker Registration & Offline/PWA Helper
// Shared session recovery for every page that registers the application.
// A page-specific client may still provide richer error handling; this only
// retries an API request once after a valid refresh token renews the access
// token.
(function installRefreshRetry() {
  const nativeFetch = window.fetch.bind(window);
  const apiBase = 'https://schoolmanagementsystem-production-6624.up.railway.app/api/v1';
  let refreshPromise = null;

  async function refreshAccessToken() {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) return false;
    if (!refreshPromise) {
      refreshPromise = nativeFetch(`${apiBase}/auth/users/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      }).then(async (response) => {
        if (!response.ok) return false;
        const data = await response.json();
        if (!data.access) return false;
        localStorage.setItem('authToken', data.access);
        if (data.refresh) localStorage.setItem('refreshToken', data.refresh);
        return true;
      }).catch(() => false).finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
  }

  window.fetch = async function fetchWithRefresh(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const isApiRequest = url.includes('/api/v1/');
    const isRefreshRequest = url.includes('/auth/users/refresh/');
    const response = await nativeFetch(input, init);
    if (response.status !== 401 || !isApiRequest || isRefreshRequest || !(await refreshAccessToken())) {
      return response;
    }

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('Authorization', `Bearer ${localStorage.getItem('authToken')}`);
    if (input instanceof Request && !init) {
      return nativeFetch(new Request(input, { headers }));
    }
    return nativeFetch(input, { ...init, headers });
  };
}());

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js');
      console.log('✅ Service Worker registered successfully:', registration.scope);

      // Listen for background sync when back online
      window.addEventListener('online', async () => {
        console.log('🌐 Connection restored. Triggering background sync...');
        if ('sync' in registration) {
          try {
            await registration.sync.register('sync-django-backend');
          } catch (e) {
            console.warn('Sync registration failed:', e);
          }
        }
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}
