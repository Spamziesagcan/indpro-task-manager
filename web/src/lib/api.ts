import { getAuthToken } from "@/lib/auth-token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://indpro-task-manager-8cx8.onrender.com/api";

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

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
    throw new Error(message || `Request failed with status ${response.status}`);
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

export const taskApi = {
  list: () => apiFetch<ApiTask[]>("/tasks"),
  create: (payload: TaskUpsertInput) => apiFetch<ApiTask>("/tasks", { method: "POST", body: payload }),
  update: (id: number, payload: TaskUpsertInput) => apiFetch<ApiTask>(`/tasks/${id}`, { method: "PUT", body: payload }),
  remove: (id: number) => apiFetch<void>(`/tasks/${id}`, { method: "DELETE" }),
};

export { apiFetch, API_BASE_URL };
