import type { ApiTask } from "@/lib/api";
import type { Status, Task } from "@/stores/useTasks";

function getDueLabel(task: ApiTask): string {
  return `Position ${task.position + 1}`;
}

export function apiTaskToTask(task: ApiTask): Task {
  return {
    id: String(task.id),
    backendId: task.id,
    title: task.title,
    description: task.description,
    status: task.status as Status,
    dueLabel: getDueLabel(task),
    position: task.position,
  };
}
