"use client";

import { LayoutGrid, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { isAuthenticated, isLoading } = useAuth();

  const statusText = isLoading ? "Checking session" : isAuthenticated ? "Signed in" : "Signed out";
  const statusDotClass = isLoading
    ? "bg-amber-400"
    : isAuthenticated
      ? "bg-emerald-400"
      : "bg-slate-500";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <LayoutGrid className="h-5 w-5 text-indigo-300" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">Indpro Task Manager</p>
            <p className="text-xs text-slate-400">kanbanFirstProductivityWorkspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button className="rounded-full bg-indigo-500 px-4 text-white hover:bg-indigo-400">
            <Plus className="h-4 w-4" />
            New task
          </Button>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 sm:flex">
            <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
            {statusText}
          </div>
        </div>
      </div>
    </header>
  );
}