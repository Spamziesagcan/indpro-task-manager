import type { Status, Task } from "@/stores/useTasks";

export function sortTasks(tasks: Task[]) {
  const grouped: Record<Status, Task[]> = {
    todo: [],
    "in-progress": [],
    done: [],
  };

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  for (const status of Object.keys(grouped) as Status[]) {
    grouped[status].sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));
    grouped[status] = grouped[status].map((task, index) => ({ ...task, position: index }));
  }

  return [...grouped.todo, ...grouped["in-progress"], ...grouped.done];
}
