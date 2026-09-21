"use client";
import { motion } from "framer-motion";
import { Camera, Puzzle, Shirt, Flame, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    href: "/create/analyze",
    icon: Camera,
    title: "Analisar meu look",
    desc: "Tire uma foto e receba análise completa",
    gradient: "from-[#C8A96B]/10 to-[#C8A96B]/5",
  },
  {
    href: "/create/outfit",
    icon: Puzzle,
    title: "Montar meu look",
    desc: "Crie combinações com suas roupas",
    gradient: "from-primary/5 to-primary/[0.02]",
  },
  {
    href: "/wardrobe",
    icon: Shirt,
    title: "Meu guarda-roupa",
    desc: "Visualize e organize suas peças",
    gradient: "from-[#C8A96B]/10 to-[#C8A96B]/5",
  },
  {
    href: "/radar",
    icon: Flame,
    title: "Radar de Moda",
    desc: "Descubra as tendências do momento",
    gradient: "from-primary/5 to-primary/[0.02]",
  },
];

export function HomeClient({ userName }: { userName: string | null }) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="px-5 pt-12 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[#C8A96B]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C8A96B]">STYLEWISE</span>
        </div>
        <h1 className="font-display text-2xl font-bold">
          {greeting()}{userName ? `, ${userName}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          O que vamos criar hoje?
        </p>
      </motion.div>

      <div className="space-y-4">
        {FEATURES.map((f: any, i: number) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <Link href={f.href}>
                <div
                  className={cn(
                    "bg-card rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex items-center gap-4 bg-gradient-to-r",
                    f.gradient
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
