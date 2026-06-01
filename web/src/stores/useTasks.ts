"use client";

import { create } from "zustand";

import { toast } from "@/components/ui/toast";
import { taskApi, type TaskUpsertInput } from "@/lib/api";
import { apiTaskToTask } from "@/lib/task-mappers";
import { getPendingDeleteRemainingMs, loadPendingDeleteRecords, savePendingDeleteRecords, type PendingDeleteRecord } from "@/lib/task-delete-undo";
import { sortTasks } from "@/lib/task-order";

export type Status = "todo" | "in-progress" | "done";

export type Task = {
  id: string;
  backendId: number;
  title: string;
  description: string;
  status: Status;
  dueLabel: string;
  position: number;
};

type CreatePayload = {
  title: string;
  description?: string;
  status: Status;
};

type UpdatePayload = {
  title: string;
  description: string;
  status: Status;
  position?: number;
};

type TasksState = {
  tasks: Task[];
  pendingDeletes: Record<string, PendingDeleteRecord>;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
  loadTasks: () => Promise<void>;
  createTask: (payload: CreatePayload) => Promise<Task | null>;
  updateTask: (id: string, payload: UpdatePayload) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<Task | null>;
  undoDeleteTask: (id: string) => Promise<boolean>;
  finalizeDeleteTask: (id: string) => Promise<boolean>;
  moveTask: (taskId: string, overId: string, sourceColumn: Status, destColumn: Status) => Promise<boolean>;
  normalizePositions: () => void;
  setTasks: (tasks: Task[]) => void;
};

function cloneTasks(tasks: Task[]) {
  return tasks.map((task) => ({ ...task }));
}

function normalizeLocalPositions(tasks: Task[]) {
  return sortTasks(cloneTasks(tasks));
}

function toApiPayload(payload: {
  title: string;
  description: string;
  status: Status;
  position?: number;
}): TaskUpsertInput {
  return {
    title: payload.title,
    description: payload.description,
    status: payload.status,
    ...(payload.position !== undefined ? { position: payload.position } : {}),
  };
}

function withTempId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function moveTaskLocally(tasks: Task[], taskId: string, destStatus: Status, destPosition: number) {
  const groups: Record<Status, Task[]> = {
    todo: [],
    "in-progress": [],
    done: [],
  };

  let movingTask: Task | null = null;
  for (const task of tasks) {
    if (task.id === taskId) {
      movingTask = { ...task, status: destStatus };
      continue;
    }
    groups[task.status].push({ ...task });
  }

  if (!movingTask) return normalizeLocalPositions(tasks);

  const destTasks = groups[destStatus];
  const insertAt = Math.max(0, Math.min(destPosition, destTasks.length));
  destTasks.splice(insertAt, 0, movingTask);

  const normalizeGroup = (group: Task[]) => group.map((task, index) => ({ ...task, position: index }));

  return [
    ...normalizeGroup(groups.todo),
    ...normalizeGroup(groups["in-progress"]),
    ...normalizeGroup(groups.done),
  ];
}

function updateTaskLocally(
  tasks: Task[],
  taskId: string,
  payload: {
    title: string;
    description: string;
    status: Status;
    position?: number;
  }
) {
  const groups: Record<Status, Task[]> = {
    todo: [],
    "in-progress": [],
    done: [],
  };

  let editingTask: Task | null = null;
  for (const task of tasks) {
    if (task.id === taskId) {
      editingTask = { ...task };
      continue;
    }
    groups[task.status].push({ ...task });
  }

  if (!editingTask) return normalizeLocalPositions(tasks);

  const destTasks = groups[payload.status];
  const insertAt = Math.max(0, Math.min(payload.position ?? editingTask.position, destTasks.length));

  destTasks.splice(insertAt, 0, {
    ...editingTask,
    title: payload.title,
    description: payload.description,
    status: payload.status,
  });

  const normalizeGroup = (group: Task[]) => group.map((task, index) => ({ ...task, position: index }));

  return [
    ...normalizeGroup(groups.todo),
    ...normalizeGroup(groups["in-progress"]),
    ...normalizeGroup(groups.done),
  ];
}

function insertTaskLocally(tasks: Task[], task: Task) {
  const groups: Record<Status, Task[]> = {
    todo: [],
    "in-progress": [],
    done: [],
  };

  for (const item of tasks) {
    if (item.id === task.id) continue;
    groups[item.status].push({ ...item });
  }

  const restoredTask = { ...task };
  const columnTasks = groups[task.status];
  const insertAt = Math.max(0, Math.min(task.position, columnTasks.length));
  columnTasks.splice(insertAt, 0, restoredTask);

  const normalizeGroup = (group: Task[]) => group.map((item, index) => ({ ...item, position: index }));

  return [
    ...normalizeGroup(groups.todo),
    ...normalizeGroup(groups["in-progress"]),
    ...normalizeGroup(groups.done),
  ];
}

function pendingDeletesToMap(records: PendingDeleteRecord[]) {
  return records.reduce<Record<string, PendingDeleteRecord>>((accumulator, record) => {
    accumulator[record.task.id] = record;
    return accumulator;
  }, {});
}

function pendingDeletesToList(records: Record<string, PendingDeleteRecord>) {
  return Object.values(records);
}

function clearPendingDeleteTimer(taskId: string) {
  const timerId = pendingDeleteTimers.get(taskId);
  if (timerId !== undefined) {
    window.clearTimeout(timerId);
    pendingDeleteTimers.delete(taskId);
  }
}

function clearAllPendingDeleteTimers() {
  for (const taskId of pendingDeleteTimers.keys()) {
    clearPendingDeleteTimer(taskId);
  }
}

function persistPendingDeletes(pendingDeletes: Record<string, PendingDeleteRecord>) {
  savePendingDeleteRecords(pendingDeletesToList(pendingDeletes));
}

const taskUpdateVersions = new Map<string, number>();

function nextTaskUpdateVersion(taskId: string) {
  const nextVersion = (taskUpdateVersions.get(taskId) ?? 0) + 1;
  taskUpdateVersions.set(taskId, nextVersion);
  return nextVersion;
}

function isLatestTaskUpdateVersion(taskId: string, version: number) {
  return taskUpdateVersions.get(taskId) === version;
}

function syncPendingDeleteTimers(finalizeDelete: (taskId: string) => Promise<boolean>, pendingDeletes: Record<string, PendingDeleteRecord>) {
  clearAllPendingDeleteTimers();

  for (const pendingDelete of Object.values(pendingDeletes)) {
    const remainingMs = getPendingDeleteRemainingMs(pendingDelete);
    const timerId = window.setTimeout(() => {
      void finalizeDelete(pendingDelete.task.id);
    }, remainingMs);
    pendingDeleteTimers.set(pendingDelete.task.id, timerId);
  }
}

const pendingDeleteTimers = new Map<string, number>();
const pendingDeleteState = pendingDeletesToMap(loadPendingDeleteRecords());
const UNDO_DELETE_WINDOW_MS = 5000;

export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  pendingDeletes: pendingDeleteState,
  isLoading: false,
  error: null,
  hasLoaded: false,

  setTasks(tasks) {
    const pendingDeletes = get().pendingDeletes;
    const visibleTasks = tasks.filter((task) => !pendingDeletes[task.id]);
    set({ tasks: normalizeLocalPositions(visibleTasks) });
  },

  normalizePositions() {
    set(({ tasks }) => ({ tasks: normalizeLocalPositions(tasks) }));
  },

  async loadTasks() {
    set({ isLoading: true, error: null });
    try {
      const apiTasks = await taskApi.list();
      const tasks = apiTasks.map(apiTaskToTask);
      const pendingDeletes = get().pendingDeletes;
      const hiddenTaskIds = new Set(Object.keys(pendingDeletes));
      const visibleTasks = tasks.filter((task) => !hiddenTaskIds.has(task.id));
      set({ tasks: normalizeLocalPositions(visibleTasks), isLoading: false, hasLoaded: true });
      syncPendingDeleteTimers(get().finalizeDeleteTask, get().pendingDeletes);
    } catch (error) {
      set({ error: resolveError(error), isLoading: false, hasLoaded: true });
    }
  },

  async createTask(payload) {
    const previousTasks = cloneTasks(get().tasks);
    const tempTask: Task = {
      id: withTempId("temp-task"),
      backendId: -1,
      title: payload.title,
      description: payload.description ?? "",
      status: payload.status,
      dueLabel: "Saving...",
      position: previousTasks.filter((task) => task.status === payload.status).length,
    };

    const optimisticTasks = normalizeLocalPositions([...previousTasks, tempTask]);
    set({ tasks: optimisticTasks, error: null });

    try {
      const created = await taskApi.create(
        toApiPayload({
          title: payload.title,
          description: payload.description ?? "",
          status: payload.status,
          position: tempTask.position,
        })
      );
      const mapped = apiTaskToTask(created);
      set({
        tasks: normalizeLocalPositions(
          get().tasks.map((task) => (task.id === tempTask.id ? mapped : task))
        ),
      });
      return mapped;
    } catch (error) {
      set({ tasks: previousTasks, error: resolveError(error) });
      return null;
    }
  },

  async updateTask(id, payload) {
    const previousTasks = cloneTasks(get().tasks);
    const target = previousTasks.find((task) => task.id === id);
    if (!target) return null;

    const version = nextTaskUpdateVersion(id);

    const nextTasks = updateTaskLocally(previousTasks, id, payload);
    set({ tasks: nextTasks, error: null });

    try {
      const updated = await taskApi.update(
        target.backendId,
        toApiPayload({
          title: payload.title,
          description: payload.description,
          status: payload.status,
          position: payload.position,
        })
      );
      if (!isLatestTaskUpdateVersion(id, version)) {
        return null;
      }
      const mapped = apiTaskToTask(updated);
      set({ tasks: normalizeLocalPositions(get().tasks.map((task) => (task.id === id ? mapped : task))) });
      return mapped;
    } catch (error) {
      if (!isLatestTaskUpdateVersion(id, version)) {
        return null;
      }
      set({ tasks: previousTasks, error: resolveError(error) });
      return null;
    }
  },

  async deleteTask(id) {
    const previousTasks = cloneTasks(get().tasks);
    const target = previousTasks.find((task) => task.id === id);
    if (!target) return null;

    const pendingDelete: PendingDeleteRecord = {
      task: target,
      expiresAt: Date.now() + UNDO_DELETE_WINDOW_MS,
    };

    const nextPendingDeletes = {
      ...get().pendingDeletes,
      [id]: pendingDelete,
    };

    set({
      tasks: normalizeLocalPositions(previousTasks.filter((task) => task.id !== id)),
      pendingDeletes: nextPendingDeletes,
      error: null,
    });
    persistPendingDeletes(nextPendingDeletes);

    clearPendingDeleteTimer(id);
    const timerId = window.setTimeout(() => {
      void get().finalizeDeleteTask(id);
    }, Math.max(pendingDelete.expiresAt - Date.now(), 0));
    pendingDeleteTimers.set(id, timerId);

    return target;
  },

  async undoDeleteTask(id) {
    const pendingDelete = get().pendingDeletes[id];
    if (!pendingDelete) return false;

    clearPendingDeleteTimer(id);

    const nextPendingDeletes = { ...get().pendingDeletes };
    delete nextPendingDeletes[id];

    set({
      tasks: insertTaskLocally(get().tasks, pendingDelete.task),
      pendingDeletes: nextPendingDeletes,
      error: null,
    });
    persistPendingDeletes(nextPendingDeletes);
    return true;
  },

  async finalizeDeleteTask(id) {
    const pendingDelete = get().pendingDeletes[id];
    if (!pendingDelete) return false;

    clearPendingDeleteTimer(id);

    try {
      await taskApi.remove(pendingDelete.task.backendId);
      const nextPendingDeletes = { ...get().pendingDeletes };
      delete nextPendingDeletes[id];
      set({ pendingDeletes: nextPendingDeletes, error: null });
      persistPendingDeletes(nextPendingDeletes);
      return true;
    } catch (error) {
      const message = resolveError(error);
      if (message.toLowerCase().includes("task not found")) {
        const nextPendingDeletes = { ...get().pendingDeletes };
        delete nextPendingDeletes[id];
        set({ pendingDeletes: nextPendingDeletes, error: null });
        persistPendingDeletes(nextPendingDeletes);
        return true;
      }

      const restoredPendingDeletes = { ...get().pendingDeletes };
      delete restoredPendingDeletes[id];
      set({
        tasks: insertTaskLocally(get().tasks, pendingDelete.task),
        pendingDeletes: restoredPendingDeletes,
        error: message,
      });
      persistPendingDeletes(restoredPendingDeletes);
      toast.error(message);
      return false;
    }
  },

  async moveTask(taskId, overId, sourceColumn, destColumn) {
    const currentTasks = cloneTasks(get().tasks);
    const movingTask = currentTasks.find((task) => task.id === taskId);
    if (!movingTask) return false;

    const destTasks = currentTasks
      .filter((task) => task.status === destColumn && task.id !== taskId)
      .sort((a, b) => a.position - b.position);
    const overIndex = destTasks.findIndex((task) => task.id === overId);
    const insertAt = overIndex === -1 ? destTasks.length : overIndex;
    const snapshot = cloneTasks(currentTasks);

    set({ tasks: moveTaskLocally(currentTasks, taskId, destColumn, insertAt), error: null });

    try {
      const updated = await taskApi.update(
        movingTask.backendId,
        toApiPayload({
          title: movingTask.title,
          description: movingTask.description,
          status: destColumn,
          position: insertAt,
        })
      );
      const mapped = apiTaskToTask(updated);
      set({ tasks: normalizeLocalPositions(get().tasks.map((task) => (task.id === taskId ? mapped : task))) });
      return true;
    } catch (error) {
      set({ tasks: snapshot, error: resolveError(error) });
      return false;
    }
  },
}));

export default useTasks;
