// auth_test.js
// Node script to verify auth.js functionality using jsdom and mocked fetch.

import { JSDOM } from "jsdom";
import { signIn, signUp, isAuthenticated, getCurrentUser, getUserRole, logout } from "./auth.js";

// Polyfill atob for Node (jsdom doesn't provide it by default)
global.atob = (b64) => Buffer.from(b64, "base64").toString("binary");

// Create a minimal DOM environment (required for localStorage)
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { url: "http://localhost" });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

// Mock fetch to simulate backend responses
global.fetch = async (url, options) => {
  const { method, body } = options || {};
  // Simple fake JWT payload: { user: { username: "test", role: "admin" } }
  const fakePayload = { user: { username: "test", role: "admin" } };
  const base64 = Buffer.from(JSON.stringify(fakePayload)).toString("base64");
  const fakeToken = `header.${base64}.signature`;

  if (url.endsWith("/auth/users/login/") && method === "POST") {
    return {
      ok: true,
      json: async () => ({ access: fakeToken, message: "Logged in" }),
    };
  }
  if (url.endsWith("/auth/users/register/") && method === "POST") {
    return {
      ok: true,
      json: async () => ({ access: fakeToken, message: "Signed up" }),
    };
  }
  // Default fallback
  return { ok: false, status: 404, text: async () => "Not Found" };
};

async function runTests() {
  console.log("Testing signIn...");
  await signIn({ username: "test", password: "pass" });
  console.log("Token stored?", !!localStorage.getItem("authToken"));
  console.log("isAuthenticated?", isAuthenticated());
  console.log("Current user:", getCurrentUser());
  console.log("User role:", getUserRole());

  console.log("Testing logout...");
  logout();
  console.log("isAuthenticated after logout?", isAuthenticated());

  console.log("Testing signUp...");
  await signUp({ username: "new", password: "pass", email: "new@example.com", role: "admin" });
  console.log("Token after signUp?", !!localStorage.getItem("authToken"));
}

runTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Test error:", err);
    process.exit(1);
  });
