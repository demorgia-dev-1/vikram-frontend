import axios, { AxiosError } from "axios";

export const TOKEN_KEY = "vikram_token";

export const getToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const api = axios.create({
  baseURL: process.env.BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) clearToken();
    return Promise.reject(error);
  },
);

/** Pulls a readable message out of whatever shape the API returned. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Unable to reach the server. Please check your connection.";
    }

    const data = error.response.data as Record<string, unknown> | undefined;
    for (const key of ["message", "error", "detail"]) {
      const value = data?.[key];
      if (typeof value === "string" && value) return value;
    }

    return error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export default api;
