import type { Task } from "@/stores/useTasks";

export type PendingDeleteRecord = {
  task: Task;
  expiresAt: number;
};

const STORAGE_KEY = "indpro-task-manager.pending-deletes";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTask(value: unknown): value is Task {
  if (!isObject(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.backendId === "number" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    (value.status === "todo" || value.status === "in-progress" || value.status === "done") &&
    typeof value.dueLabel === "string" &&
    typeof value.position === "number"
  );
}

function isPendingDeleteRecord(value: unknown): value is PendingDeleteRecord {
  return (
    isObject(value) &&
    isTask(value.task) &&
    typeof value.expiresAt === "number"
  );
}

export function loadPendingDeleteRecords(): PendingDeleteRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isPendingDeleteRecord);
  } catch {
    return [];
  }
}

export function savePendingDeleteRecords(records: PendingDeleteRecord[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getPendingDeleteRemainingMs(record: PendingDeleteRecord) {
  return Math.max(record.expiresAt - Date.now(), 0);
}
