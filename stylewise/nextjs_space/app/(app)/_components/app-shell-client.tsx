"use client";
import { BottomNav } from "@/components/bottom-nav";

export function AppShellClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
