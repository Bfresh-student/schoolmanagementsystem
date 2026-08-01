// sw-register.js
// Systematic Service Worker Registration & Offline/PWA Helper

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
