"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  Layers3,
  Plus,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { TaskCard } from "@/components/kanban/task-card";
import { useTasks, type Task as StoreTask } from "@/stores/useTasks";
import { EmptyColumnState, KanbanBoardSkeleton } from "@/components/kanban/board-states";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { AnimatePresence } from "framer-motion";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Column } from "@/components/kanban/column";
import { clearAuthToken } from "@/lib/auth-token";

type Status = "todo" | "in-progress" | "done";

type Task = StoreTask;

type ColumnConfig = {
  id: Status;
  title: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
};

type DraftTask = {
  title: string;
  description: string;
};

type EditTaskDraft = {
  title: string;
  description: string;
  status: Status;
  position: string;
};

const columns: ColumnConfig[] = [
  {
    id: "todo",
    title: "Todo",
    accent: "from-sky-400/30 via-sky-400/10 to-transparent",
    icon: Layers3,
  },
  {
    id: "in-progress",
    title: "In Progress",
    accent: "from-violet-400/30 via-violet-400/10 to-transparent",
    icon: Clock3,
  },
  {
    id: "done",
    title: "Done",
    accent: "from-emerald-400/30 via-emerald-400/10 to-transparent",
    icon: CalendarDays,
  },
];

export function KanbanBoard() {
  const router = useRouter();
  const tasks = useTasks((s) => s.tasks);
  const pendingDeletes = useTasks((s) => s.pendingDeletes);
  const createTask = useTasks((s) => s.createTask);
  const updateTask = useTasks((s) => s.updateTask);
  const deleteTaskFromStore = useTasks((s) => s.deleteTask);
  const undoDeleteTask = useTasks((s) => s.undoDeleteTask);
  const moveTask = useTasks((s) => s.moveTask);
  const loadTasks = useTasks((s) => s.loadTasks);
  const isLoading = useTasks((s) => s.isLoading);
  const error = useTasks((s) => s.error);
  const hasLoaded = useTasks((s) => s.hasLoaded);

  React.useEffect(() => {
    if (!hasLoaded) {
      void loadTasks();
    }
  }, [hasLoaded, loadTasks]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [activeStatus, setActiveStatus] = React.useState<Status>("todo");
  const [draft, setDraft] = React.useState<DraftTask>({ title: "", description: "" });
  const [recentlyCreatedTaskId, setRecentlyCreatedTaskId] = React.useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState<EditTaskDraft>({
    title: "",
    description: "",
    status: "todo",
    position: "1",
  });
  const shownUndoToastIdsRef = React.useRef(new Set<string>());
  const selectedTask = React.useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const showUndoToast = React.useCallback(
    (task: StoreTask, expiresAt: number) => {
      if (shownUndoToastIdsRef.current.has(task.id)) return;

      shownUndoToastIdsRef.current.add(task.id);
      const remainingMs = Math.max(expiresAt - Date.now(), 0);

      toast("Task deleted — Undo", {
        description: task.title,
        duration: remainingMs || 5000,
        action: {
          label: "Undo",
          onClick: () => {
            void undoDeleteTask(task.id);
          },
        },
      });
    },
    [undoDeleteTask]
  );

  React.useEffect(() => {
    const pendingDeleteIds = new Set(Object.keys(pendingDeletes));

    for (const shownId of Array.from(shownUndoToastIdsRef.current)) {
      if (!pendingDeleteIds.has(shownId)) {
        shownUndoToastIdsRef.current.delete(shownId);
      }
    }

    for (const pendingDelete of Object.values(pendingDeletes)) {
      const remainingMs = pendingDelete.expiresAt - Date.now();
      if (remainingMs <= 0) continue;
      showUndoToast(pendingDelete.task, pendingDelete.expiresAt);
    }
  }, [pendingDeletes, showUndoToast]);

  React.useEffect(() => {
    if (selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskId, tasks]);

  useKeyboardShortcuts({
    n: () => {
      openCreateDialog(selectedTask?.status ?? "todo");
    },
    e: () => {
      if (!selectedTask || isEditDialogOpen) return;
      openEditDialog(selectedTask);
    },
    delete: () => {
      if (!selectedTask || isEditDialogOpen) return;
      void deleteTask(selectedTask.id);
      setSelectedTaskId(null);
    },
  });

  const openCreateDialog = (status: Status) => {
    setActiveStatus(status);
    setDraft({ title: "", description: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = React.useCallback((task: Task) => {
    setSelectedTaskId(task.id);
    setEditingTaskId(task.id);
    setEditDraft({
      title: task.title,
      description: task.description,
      status: task.status,
      position: String(task.position + 1),
    });
    setIsEditDialogOpen(true);
  }, []);

  const closeEditDialog = React.useCallback(() => {
    setIsEditDialogOpen(false);
    setEditingTaskId(null);
  }, []);

  const commitEdit = React.useCallback(async () => {
    const taskId = editingTaskId;
    if (!taskId) return;

    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      closeEditDialog();
      return;
    }

    const nextTitle = editDraft.title.trim();
    const nextDescription = editDraft.description.trim();
    const parsedPosition = Number.parseInt(editDraft.position, 10);
    const nextPosition = Number.isFinite(parsedPosition) ? Math.max(1, parsedPosition) - 1 : task.position;

    if (!nextTitle) {
      toast.error("Task title is required.");
      return;
    }

    const updatedTask = await updateTask(taskId, {
      title: nextTitle,
      description: nextDescription,
      status: editDraft.status,
      position: nextPosition,
    });

    if (!updatedTask) {
      toast.error("Unable to update task.");
      return;
    }

    closeEditDialog();
    toast.success("Task updated.");
  }, [closeEditDialog, editDraft.description, editDraft.position, editDraft.status, editDraft.title, editingTaskId, tasks, updateTask]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.title.trim()) {
      toast.error("Task title is required.");
      return;
    }

    const createdTask = await createTask({
      title: draft.title.trim(),
      description: draft.description.trim(),
      status: activeStatus,
    });
    if (!createdTask) {
      toast.error("Unable to create task.");
      return;
    }
    toast.success(`Added to ${columns.find((column) => column.id === activeStatus)?.title}.`);
    setRecentlyCreatedTaskId(createdTask.id);

    setIsDialogOpen(false);
  };

  const deleteTask = async (taskId: string) => {
    const removed = await deleteTaskFromStore(taskId);
    if (!removed) {
      toast.error("Unable to delete task.");
      return;
    }

    if (selectedTaskId === removed.id) {
      setSelectedTaskId(null);
    }

    const pendingDelete = useTasks.getState().pendingDeletes[removed.id];
    showUndoToast(removed, pendingDelete?.expiresAt ?? Date.now() + 5000);
  };

  const findColumnTaskIds = (columnId: Status) => tasks.filter((t) => t.status === columnId).map((t) => t.id);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // reserved for placeholder/feedback logic if needed
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overId = over.id as string;

    const sourceColumn = active.data?.current?.columnId as Status | undefined;
    const destColumn = (over.data?.current?.columnId as Status | undefined) ?? (columns.find((c) => c.id === overId)?.id as Status | undefined);

    if (!sourceColumn || !destColumn) return;

    if (sourceColumn === destColumn && activeIdStr === overId) return;

    const moved = await moveTask(activeIdStr, overId, sourceColumn, destColumn);
    if (!moved) {
      toast.error("Unable to move task.");
    }
  };

  const retryLoad = () => {
    void loadTasks();
  };

  const handleLogout = () => {
    clearAuthToken();
    router.push("/auth");
  };

  React.useEffect(() => {
    if (!recentlyCreatedTaskId) return;
    const timeoutId = window.setTimeout(() => setRecentlyCreatedTaskId(null), 1400);
    return () => window.clearTimeout(timeoutId);
  }, [recentlyCreatedTaskId]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel relative overflow-hidden rounded-[28px] border border-white/10 px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,140,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(91,107,255,0.14),transparent_26%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              <Layers3 className="h-3.5 w-3.5 text-indigo-300" />
              Product overview
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                A focused Kanban workspace for teams that ship on time.
              </h1>
              <p className="max-w-4xl text-sm leading-6 text-slate-300 sm:text-base">
                Plan priorities, move work across stages, and keep delivery visible in
                real time. Indpro Kanban combines a clean board experience with fast,
                reliable task operations for day-to-day execution.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="h-11 rounded-full border-white/10 bg-white/5 px-5 text-slate-100 hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" className="h-9 rounded-full border-rose-300/20 bg-transparent text-rose-100 hover:bg-rose-500/10" onClick={retryLoad}>
              Retry
            </Button>
          </div>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {isLoading && !tasks.length ? (
          <KanbanBoardSkeleton />
        ) : (
          <section className="flex justify-center gap-5 overflow-x-auto pb-4">
            {columns.map((column) => {
              const columnTasks = tasks.filter((task) => task.status === column.id);
              return (
                <Column
                  key={column.id}
                  columnId={column.id}
                  columnTitle={column.title}
                  columnAccent={column.accent}
                  icon={column.icon}
                  tasks={columnTasks}
                  isLoading={isLoading}
                  selectedTaskId={selectedTaskId}
                  recentlyCreatedTaskId={recentlyCreatedTaskId}
                  onEdit={openEditDialog}
                  onDelete={deleteTask}
                  onSelect={setSelectedTaskId}
                  onCreateClick={openCreateDialog}
                />
              );
            })}
          </section>
        )}

        <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(.2,.8,.2,1)" }}>
          {activeId ? (
            (() => {
              const activeTask = tasks.find((t) => t.id === activeId);
              if (!activeTask) return null;
              return (
                <TaskCard
                  title={activeTask.title}
                  description={activeTask.description}
                  dueLabel={activeTask.dueLabel}
                  accent={activeTask.status === "todo" ? "sky" : activeTask.status === "in-progress" ? "violet" : "emerald"}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onSelect={() => setSelectedTaskId(activeTask.id)}
                  isDraggingPreview
                />
              );
            })()
          ) : null}
        </DragOverlay>
      </DndContext>

      <Modal open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ModalContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <ModalHeader className="text-left">
              <ModalTitle>Add task</ModalTitle>
              <ModalDescription>
                {`Create a new task in ${columns.find((column) => column.id === activeStatus)?.title}.`}
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Title</label>
                <Input
                  value={draft.title}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))}
                  placeholder="Write a task title"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Description</label>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, description: event.target.value }))}
                  placeholder="Add a short description"
                  rows={4}
                  className="flex w-full rounded-[var(--radius)] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/10 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                />
              </div>
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-full px-5 text-white">
                Create task
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (open) return;
          closeEditDialog();
        }}
      >
        <ModalContent>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void commitEdit();
            }}
          >
            <ModalHeader className="text-left">
              <ModalTitle>Edit task</ModalTitle>
              <ModalDescription>
                Update the name, description, status, and position of this task.
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Title</label>
                <Input
                  value={editDraft.title}
                  onChange={(event) =>
                    setEditDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }))
                  }
                  placeholder="Write a task title"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Description</label>
                <textarea
                  value={editDraft.description}
                  onChange={(event) =>
                    setEditDraft((currentDraft) => ({ ...currentDraft, description: event.target.value }))
                  }
                  placeholder="Add a short description"
                  rows={4}
                  className="flex w-full rounded-[var(--radius)] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-black/10 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Status</label>
                  <select
                    value={editDraft.status}
                    onChange={(event) =>
                      setEditDraft((currentDraft) => ({
                        ...currentDraft,
                        status: event.target.value as Status,
                      }))
                    }
                    className="flex h-11 w-full rounded-[var(--radius)] border border-white/10 bg-white/5 px-4 text-sm text-slate-100 shadow-inner shadow-black/10 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Position</label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={editDraft.position}
                    onChange={(event) =>
                      setEditDraft((currentDraft) => ({ ...currentDraft, position: event.target.value }))
                    }
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                onClick={closeEditDialog}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-full px-5 text-white">
                Save changes
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}