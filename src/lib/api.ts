import { createApiClient } from "./api-client";
let storage: Storage | undefined;
try {
  storage = window.sessionStorage;
} catch {
  /* The client falls back to memory. */
}
export const api = createApiClient({
  baseUrl: import.meta.env.VITE_API_URL || "/api/v1",
  storage,
});
