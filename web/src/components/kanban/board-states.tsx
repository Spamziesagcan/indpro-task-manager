"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const loadingColumns = ["todo", "in-progress", "done"] as const;

export function KanbanBoardSkeleton() {
  return (
    <section className="flex gap-5 overflow-x-auto pb-4">
      {loadingColumns.map((column) => (
        <Card
          key={column}
          className="relative min-w-[320px] flex-none overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.9),rgba(2,6,23,0.9))]"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-white/10 via-white/20 to-white/10" />
          <CardHeader className="space-y-4 border-b border-white/10 px-5 py-5">
            <div className="h-4 w-28 rounded-full bg-white/10 animate-pulse" />
            <div className="h-3 w-20 rounded-full bg-white/5 animate-pulse" />
          </CardHeader>

          <CardContent className="space-y-4 px-5 py-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]"
              >
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-4/5 rounded-full bg-white/10" />
                  <div className="h-3 w-full rounded-full bg-white/5" />
                  <div className="h-3 w-3/4 rounded-full bg-white/5" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-6 w-24 rounded-full bg-white/10" />
                    <div className="h-8 w-8 rounded-full bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>

          <CardFooter className="border-t border-white/10 px-5 py-4">
            <Button variant="outline" className="w-full rounded-full border-white/10 bg-white/5 text-slate-100 opacity-50">
              Loading board...
            </Button>
          </CardFooter>
        </Card>
      ))}
    </section>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  onAction?: () => void;
  actionLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
};

export function EmptyState({
  title,
  description,
  onAction,
  actionLabel,
  icon: Icon = Sparkles,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-2xl border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-8 text-center text-sm text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-indigo-300 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mx-auto max-w-[15rem] text-sm font-medium leading-6 text-slate-100">
        {title}
      </div>
      <div className="mt-2 text-xs leading-5 text-slate-500">{description}</div>
      {onAction && actionLabel ? (
        <Button
          type="button"
          onClick={onAction}
          variant="outline"
          className="mt-4 rounded-full border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
        >
          {actionLabel}
        </Button>
      ) : null}
    </motion.div>
  );
}

export function EmptyColumnState({ title, description, onCreate }: { title: string; description: string; onCreate: () => void }) {
  return (
    <EmptyState
      title={title}
      description={description}
      onAction={onCreate}
      actionLabel="Create task"
    />
  );
}
