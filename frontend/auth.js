// auth.js
// Connection system for the backend: sign‑up, sign‑in, logout, role handling, and JWT auto-refresh.
// Uses the same DJANGO_API_URL as other API managers.

const DJANGO_API_URL = "http://localhost:8000/api/v1"; // Local dev backend
const TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "authUser"; // Stores full user object from login/register response

/** Helper: persist user data object */
function setUserData(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

/** Helper: retrieve stored user data object */
function getUserData() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/** Helper: store JWT tokens */
function setToken(token, refresh) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } else if (token === null) {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/** Helper: retrieve JWT access token */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Helper: retrieve JWT refresh token */
function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** Attempt to refresh access token automatically */
export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const resp = await fetch(`${DJANGO_API_URL}/auth/users/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh })
    });
    if (!resp.ok) {
      logout();
      return null;
    }
    const data = await resp.json();
    if (data.access) {
      setToken(data.access, null);
      return data.access;
    }
  } catch (e) {
    console.warn("Failed to refresh access token", e);
  }
  logout();
  return null;
}

/** Helper: decode JWT payload (base64Url) */
function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch (e) {
    console.warn("Failed to decode JWT payload", e);
    return null;
  }
}

/** Sign‑up a new user. */
export async function signUp(data) {
  const url = `${DJANGO_API_URL}/auth/users/register/`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Sign-up failed: ${resp.status} ${err}`);
  }
  const result = await resp.json();
  const token = result.access || result.token;
  const refresh = result.refresh;
  if (token) setToken(token, refresh);
  if (result.user) setUserData(result.user);
  return result;
}

/** Sign‑in an existing user. */
export async function signIn(credentials) {
  const url = `${DJANGO_API_URL}/auth/users/login/`;
  const payload = {
    email: credentials.email || credentials.username,
    password: credentials.password,
    role: credentials.role
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Sign-in failed: ${resp.status} ${err}`);
  }
  const result = await resp.json();
  const token = result.access || result.token;
  const refresh = result.refresh;
  if (token) setToken(token, refresh);
  if (result.user) setUserData(result.user);
  return result;
}

/** Logout the current user */
export function logout() {
  setToken(null, null);
  setUserData(null);
}

/** Check if a user is authenticated */
export function isAuthenticated() {
  return !!getToken();
}

/** Get current user info — prefers stored user object, falls back to JWT decode */
export function getCurrentUser() {
  const stored = getUserData();
  if (stored) return stored;
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload ? payload.user || payload : null;
}

/** Get the role of the current user */
export function getUserRole() {
  const user = getCurrentUser();
  if (!user) return null;
  return user.role || user.roles || null;
}

/** Helper: make an authenticated request with auto 401 refresh retry. */
export async function authFetch(endpoint, { method = "GET", body = null } = {}, isRetry = false) {
  let token = getToken();
  const url = `${DJANGO_API_URL}/${endpoint}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const resp = await fetch(url, options);

  if (resp.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return authFetch(endpoint, { method, body }, true);
    }
  }

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Request failed: ${resp.status} ${err}`);
  }
  return resp.json();
}
