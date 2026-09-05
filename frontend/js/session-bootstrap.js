/*
 * CEJEC - restauration de session au démarrage.
 *
 * Les pages PWA doivent accepter une session dont le jeton d'accès a expiré
 * tant qu'un refresh token valide est disponible. Cette étape est volontairement
 * indépendante des écrans afin que l'index et le dashboard appliquent la même
 * règle.
 */
(function () {
  'use strict';

  const API_BASE = 'https://schoolmanagementsystem-production-6624.up.railway.app/api/v1';
  const ACCESS_KEY = 'authToken';
  const REFRESH_KEY = 'refreshToken';

  function accessTokenIsUsable(token) {
    if (!token) return false;
    try {
      const encodedPayload = token.split('.')[1];
      if (!encodedPayload) return true;
      const payload = JSON.parse(atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/')));
      // Un token sans exp reste compatible avec un fournisseur d'identité externe.
      return !payload.exp || payload.exp * 1000 > Date.now() + 10_000;
    } catch (_) {
      // Ne pas casser les sessions déjà existantes si le token n'est pas un JWT.
      return true;
    }
  }

  async function restoreSession() {
    const access = localStorage.getItem(ACCESS_KEY);
    if (accessTokenIsUsable(access)) return true;

    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) {
      // En mode PWA hors ligne, une session locale existante reste utilisable.
      return Boolean(access) && navigator.onLine === false;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/users/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!response.ok) throw new Error(`Refresh rejected (${response.status})`);

      const tokens = await response.json();
      if (!tokens.access) throw new Error('Refresh response has no access token');
      localStorage.setItem(ACCESS_KEY, tokens.access);
      if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
      return true;
    } catch (error) {
      // Une indisponibilité réseau ne doit jamais éjecter un utilisateur du PWA.
      if (navigator.onLine === false && access) return true;
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem('authUser');
      return false;
    }
  }

  window.cejecSessionReady = restoreSession();
  window.CEJECSession = { restoreSession, accessTokenIsUsable };
})();
