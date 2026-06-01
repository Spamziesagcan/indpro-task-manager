"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EmptyColumnState } from "@/components/kanban/board-states";
import SortableTask from "@/components/kanban/sortable-task";
import type { Task } from "@/stores/useTasks";

type ColumnProps = {
  columnId: string;
  columnTitle: string;
  columnAccent: string;
  icon: React.ComponentType<{ className?: string }>;
  tasks: Task[];
  isLoading: boolean;
  selectedTaskId: string | null;
  recentlyCreatedTaskId: string | null;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onSelect: (taskId: string) => void;
  onCreateClick: (columnId: string) => void;
};

export function Column({
  columnId,
  columnTitle,
  columnAccent,
  icon: Icon,
  tasks,
  isLoading,
  selectedTaskId,
  recentlyCreatedTaskId,
  onEdit,
  onDelete,
  onSelect,
  onCreateClick,
}: ColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: columnId,
    data: { type: "column", columnId },
  });

  const columnTaskIds = tasks.map((t) => t.id);

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "relative min-w-[320px] flex-none overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.9),rgba(2,6,23,0.9))]",
        isOver ? "ring-2 ring-offset-2 ring-indigo-400/20" : ""
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", columnAccent)} />
      <CardHeader className="space-y-4 border-b border-white/10 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Icon className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <CardTitle className="text-white">{columnTitle}</CardTitle>
              <CardDescription>{tasks.length} tasks</CardDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            onClick={() => onCreateClick(columnId)}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add task to {columnTitle}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5 py-5">
        <SortableContext items={columnTaskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <EmptyColumnState
              title="No tasks yet. Press N to create your first task."
              description={
                isLoading
                  ? "Fetching tasks from the server."
                  : `This ${columnTitle.toLowerCase()} column is waiting for its first card.`
              }
              onCreate={() => onCreateClick(columnId)}
            />
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {tasks.map((task) => (
                <SortableTask
                  key={task.id}
                  id={task.id}
                  task={task}
                  onEdit={() => onEdit(task)}
                  onDelete={() => onDelete(task.id)}
                  onSelect={() => onSelect(task.id)}
                  isFresh={task.id === recentlyCreatedTaskId}
                  isSelected={task.id === selectedTaskId}
                />
              ))}
            </AnimatePresence>
          )}
        </SortableContext>
      </CardContent>

      <CardFooter className="border-t border-white/10 px-5 py-4">
        <Button
          variant="outline"
          className="w-full rounded-full border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
          onClick={() => onCreateClick(columnId)}
        >
          <Plus className="h-4 w-4" />
          Add task
        </Button>
      </CardFooter>
    </Card>
  );
}
