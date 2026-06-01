"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

import { TaskCard } from "./task-card";

type SortableTaskProps = {
  id: string;
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
    dueLabel: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onSelect?: () => void;
  isEditingTitle?: boolean;
  editTitle?: string;
  onEditTitleChange?: (value: string) => void;
  onEditTitleCommit?: () => void;
  onEditTitleCancel?: () => void;
  editFocusVersion?: number;
  isFresh?: boolean;
  isSelected?: boolean;
};

export function SortableTask({
  id,
  task,
  onEdit,
  onDelete,
  onSelect,
  isEditingTitle = false,
  editTitle = "",
  onEditTitleChange,
  onEditTitleCommit,
  onEditTitleCancel,
  editFocusVersion = 0,
  isFresh = false,
  isSelected = false,
}: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { columnId: task.status },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 160ms ease",
    zIndex: isDragging ? 9999 : undefined,
    opacity: isDragging ? 0.35 : 1,
    willChange: "transform",
    touchAction: "none",
  };

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, y: -8 }}
      style={style}
      {...attributes}
      {...listeners}
      className="select-none"
    >
      <TaskCard
        title={task.title}
        description={task.description}
        dueLabel={task.dueLabel}
        accent={task.status === "todo" ? "sky" : task.status === "in-progress" ? "violet" : "emerald"}
        onEdit={onEdit}
        onDelete={onDelete}
        onSelect={onSelect}
        isEditingTitle={isEditingTitle}
        editTitle={editTitle}
        onEditTitleChange={onEditTitleChange}
        onEditTitleCommit={onEditTitleCommit}
        onEditTitleCancel={onEditTitleCancel}
        editFocusVersion={editFocusVersion}
        isDraggingPreview={isDragging}
        isFresh={isFresh}
        isSelected={isSelected}
      />
    </motion.div>
  );
}

export default SortableTask;
