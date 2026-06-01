"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit3, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  title: string;
  description: string;
  dueLabel: string;
  accent?: "sky" | "violet" | "emerald";
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
  isDraggingPreview?: boolean;
  isSelected?: boolean;
};

const accentStyles = {
  sky: {
    dot: "bg-sky-300",
    glow: "from-sky-400/18 via-transparent to-transparent",
  },
  violet: {
    dot: "bg-violet-300",
    glow: "from-violet-400/18 via-transparent to-transparent",
  },
  emerald: {
    dot: "bg-emerald-300",
    glow: "from-emerald-400/18 via-transparent to-transparent",
  },
} as const;

export function TaskCard({
  title,
  description,
  dueLabel,
  accent = "sky",
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
  isDraggingPreview = false,
  isSelected = false,
}: TaskCardProps) {
  const styles = accentStyles[accent];
  const titleInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!isEditingTitle) return;
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  }, [editFocusVersion, isEditingTitle]);

  const commitTitle = () => {
    onEditTitleCommit?.();
  };

  const cancelTitle = () => {
    onEditTitleCancel?.();
  };

  return (
    <motion.div
      layout
      initial={isFresh ? { opacity: 0, y: 16, scale: 0.96 } : { opacity: 0, y: 10, scale: 0.985 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDraggingPreview ? 1.02 : 1,
      }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      className="group relative"
      onClick={onSelect}
    >
      <Card
        className={cn(
          "relative overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.94),rgba(2,6,23,0.92))] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition-shadow duration-300 group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.34)]",
          isDraggingPreview && "ring-1 ring-white/15",
          isSelected && "border-accent/50 ring-2 ring-accent/40 shadow-[0_0_0_1px_rgba(124,140,255,0.18),0_18px_50px_rgba(91,107,255,0.22)]"
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            styles.glow
          )}
        />

        <div className="relative space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <AnimatePresence mode="wait" initial={false}>
                {isEditingTitle ? (
                  <motion.div
                    key="editing-title"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 min-w-0"
                  >
                    <Input
                      ref={titleInputRef}
                      value={editTitle}
                      onChange={(event) => onEditTitleChange?.(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitTitle();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelTitle();
                        }
                      }}
                      onBlur={commitTitle}
                      placeholder="Task title"
                      className="h-10 rounded-2xl border-white/10 bg-white/5 px-3 text-[0.95rem] font-semibold text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0"
                    />
                  </motion.div>
                ) : (
                  <motion.button
                    key="static-title"
                    type="button"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 min-w-0 text-left"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit();
                    }}
                  >
                    <h3 className="text-[0.95rem] font-semibold leading-6 text-white transition-colors duration-200 hover:text-slate-50">
                      {title}
                    </h3>
                  </motion.button>
                )}
              </AnimatePresence>
              <span
                className={cn(
                  "mt-1 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.03)]",
                  styles.dot
                )}
                aria-hidden="true"
              />
            </div>

            <p className="text-sm leading-6 text-slate-400">
              {description || "No description provided."}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
              <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
              {dueLabel}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-300 opacity-80 transition hover:bg-white/5 hover:text-white group-hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
              >
                <Edit3 className="h-4 w-4" />
                <span className="sr-only">Edit task</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-300 opacity-80 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete task</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}