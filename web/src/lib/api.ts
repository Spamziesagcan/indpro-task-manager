import { getAuthToken } from "@/lib/auth-token";

const DEFAULT_API_ORIGIN = "https://indpro-task-manager-8cx8.onrender.com";

/** Ensures NEXT_PUBLIC_API_URL always resolves to `…/api` for path concatenation. */
function normalizeApiBaseUrl(url?: string): string {
  const raw = (url ?? `${DEFAULT_API_ORIGIN}/api`).replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

function parseApiErrorMessage(message: string): string {
  try {
    const data = JSON.parse(message) as { detail?: string };
    if (typeof data.detail === "string") return data.detail;
  } catch {
    // response body was not JSON
  }
  return message;
}

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = options.auth === false ? null : getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      parseApiErrorMessage(message) || `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export type ApiTask = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  position: number;
};

export type TaskUpsertInput = {
  title: string;
  description: string;
  status: ApiTask["status"];
  position?: number;
};

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
};

export type AuthTokenResponse = {
  access_token: string;
  user: AuthUser;
};

export const authApi = {
  login: (body: { email: string; password: string }) =>
    apiFetch<AuthTokenResponse>("/auth/login", { method: "POST", body, auth: false }),
  register: (body: { email: string; password: string; username: string; full_name: string }) =>
    apiFetch<AuthTokenResponse>("/auth/register", { method: "POST", body, auth: false }),
  me: () => apiFetch<AuthUser>("/auth/me"),
};

export const taskApi = {
  list: () => apiFetch<ApiTask[]>("/tasks"),
  create: (payload: TaskUpsertInput) => apiFetch<ApiTask>("/tasks", { method: "POST", body: payload }),
  update: (id: number, payload: TaskUpsertInput) => apiFetch<ApiTask>(`/tasks/${id}`, { method: "PUT", body: payload }),
  remove: (id: number) => apiFetch<void>(`/tasks/${id}`, { method: "DELETE" }),
};

export { apiFetch, API_BASE_URL, parseApiErrorMessage };
