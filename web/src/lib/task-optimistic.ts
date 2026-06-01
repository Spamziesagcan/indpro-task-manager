import type { Status, Task } from "@/stores/useTasks";

export function insertTask(tasks: Task[], task: Task) {
  return [...tasks, task].filter(Boolean);
}

export function removeTask(tasks: Task[], taskId: string) {
  return tasks.filter((task) => task.id !== taskId);
}

export function moveTaskLocally(tasks: Task[], taskId: string, status: Status, position: number) {
  const next = tasks.map((task) => ({ ...task }));
  const moving = next.find((task) => task.id === taskId);
  if (!moving) return next;

  const sourceStatus = moving.status;
  const remaining = next.filter((task) => task.id !== taskId);
  const sameColumn = remaining.filter((task) => task.status === status).sort((a, b) => a.position - b.position);
  const otherColumns = remaining.filter((task) => task.status !== status);

  moving.status = status;
  const insertAt = Math.max(0, Math.min(position, sameColumn.length));
  sameColumn.splice(insertAt, 0, moving);

  const normalizedSameColumn = sameColumn.map((task, index) => ({ ...task, position: index }));
  const normalizedOtherColumns = otherColumns
    .filter((task) => task.status !== sourceStatus || task.id !== taskId)
    .map((task) => ({ ...task }));

  return [...normalizedOtherColumns, ...normalizedSameColumn];
}
