// api_helper.js
// Simple wrapper for authenticated GET requests using authFetch.
// Allows other modules to fetch data without handling auth details directly.

import { authFetch } from "../auth.js";

/**
 * Perform an authenticated GET request to the given endpoint.
 * @param {string} endpoint - API endpoint relative to the base API URL (e.g., "dashboard/stats/").
 * @returns {Promise<any>} Parsed JSON response.
 */
export async function apiGet(endpoint) {
  return await authFetch(endpoint);
}
