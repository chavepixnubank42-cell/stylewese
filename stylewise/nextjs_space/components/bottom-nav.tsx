"use client";
import { usePathname, useRouter } from "next/navigation";
import { Home, Shirt, Sparkles, Flame, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/home", icon: Home, label: "Início" },
  { href: "/wardrobe", icon: Shirt, label: "Guarda-roupa" },
  { href: "/create", icon: Sparkles, label: "Criar" },
  { href: "/radar", icon: Flame, label: "Radar" },
  { href: "/favorites", icon: Heart, label: "Favoritos" },
];

const CREATE_MENU = [
  { href: "/create/outfit", label: "Monte meu look", emoji: "🧩" },
  { href: "/create/occasion", label: "Tenho uma ocasião", emoji: "🎯" },
  { href: "/create/analyze", label: "Analisar meu look", emoji: "📸" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const isActive = (href: string) => {
    if (href === "/create") return pathname?.startsWith("/create");
    return pathname === href;
  };

  return (
    <>
      <AnimatePresence>
        {showCreateMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowCreateMenu(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateMenu && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-card rounded-2xl shadow-lg p-3 flex flex-col gap-2 min-w-[220px]"
          >
            {CREATE_MENU.map((item: any) => (
              <button
                key={item.href}
                onClick={() => {
                  setShowCreateMenu(false);
                  router.push(item.href);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="font-medium text-sm text-foreground">{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border">
        <div className="flex items-center justify-around max-w-lg mx-auto py-2 px-2">
          {NAV_ITEMS.map((item: any) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const isCreate = item.href === "/create";

            return (
              <button
                key={item.href}
                onClick={() => {
                  if (isCreate) {
                    setShowCreateMenu((prev: boolean) => !prev);
                  } else {
                    setShowCreateMenu(false);
                    router.push(item.href);
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {isCreate ? (
                  <div className="w-10 h-10 rounded-full champagne-gradient flex items-center justify-center -mt-3 shadow-md">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      active && "text-[#C8A96B]"
                    )}
                  />
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
