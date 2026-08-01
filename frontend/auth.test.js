// auth.test.js
// Jest tests for auth.js (sign‑up, sign‑in, logout, token handling)

import { signUp, signIn, logout, isAuthenticated, getCurrentUser, getUserRole } from './auth.js';

// Helper to create a simple JWT with payload
function createJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = obj =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  const token = `${encode(header)}.${encode(payload)}.signature`;
  return token;
}

describe('auth.js', () => {
  const originalFetch = global.fetch;
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();
    // Mock localStorage
    const storage = {};
    global.localStorage = {
      getItem: jest.fn(key => storage[key] ?? null),
      setItem: jest.fn((key, value) => { storage[key] = value; }),
      removeItem: jest.fn(key => { delete storage[key]; }),
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.localStorage = originalLocalStorage;
  });

  test('signUp stores token on success', async () => {
    const token = createJwt({ user: { username: 'john', role: 'Admin' } });
    const mockResponse = { token };
    global.fetch.mockResolvedValue({ ok: true, json: async () => mockResponse });

    const data = { username: 'john', password: 'pwd', email: 'john@example.com', role: 'Admin' };
    const result = await signUp(data);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
    expect(global.localStorage.setItem).toHaveBeenCalledWith('authToken', token);
  });

  test('signIn stores token on success', async () => {
    const token = createJwt({ user: { username: 'alice', role: 'Professeur' } });
    const mockResponse = { token };
    global.fetch.mockResolvedValue({ ok: true, json: async () => mockResponse });

    const credentials = { username: 'alice', password: 'pwd' };
    const result = await signIn(credentials);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse);
    expect(global.localStorage.setItem).toHaveBeenCalledWith('authToken', token);
  });

  test('logout removes token', () => {
    logout();
    expect(global.localStorage.removeItem).toHaveBeenCalledWith('authToken');
  });

  test('isAuthenticated returns true when token exists', () => {
    global.localStorage.getItem.mockReturnValue('some-token');
    expect(isAuthenticated()).toBe(true);
  });

  test('isAuthenticated returns false when token missing', () => {
    global.localStorage.getItem.mockReturnValue(null);
    expect(isAuthenticated()).toBe(false);
  });

  test('getCurrentUser parses JWT payload', () => {
    const payload = { user: { username: 'bob', role: 'Direction Générale' } };
    const token = createJwt(payload);
    global.localStorage.getItem.mockReturnValue(token);
    const user = getCurrentUser();
    expect(user).toEqual(payload.user);
  });

  test('getUserRole extracts role from token', () => {
    const payload = { user: { username: 'carol', role: 'Coordination' } };
    const token = createJwt(payload);
    global.localStorage.getItem.mockReturnValue(token);
    const role = getUserRole();
    expect(role).toBe('Coordination');
  });
});
