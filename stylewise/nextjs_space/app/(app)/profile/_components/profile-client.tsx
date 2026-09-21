"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Shirt, Heart, Sparkles, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STYLES } from "@/lib/types";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ProfileClient() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      setProfile(d);
      setEditName(d?.user?.name ?? "");
      setSelectedStyles(d?.preferences?.styles ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, styles: selectedStyles }),
      });
      toast.success("Perfil atualizado!");
    } catch { toast.error("Erro"); } finally { setSaving(false); }
  };

  const toggleStyle = (s: string) => {
    setSelectedStyles((prev: string[]) =>
      (prev ?? []).includes(s) ? (prev ?? []).filter((x: string) => x !== s) : [...(prev ?? []), s]
    );
  };

  if (loading) return <div className="px-5 pt-8"><div className="h-60 rounded-2xl bg-muted shimmer" /></div>;

  return (
    <div className="px-5 pt-8 pb-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-xl font-bold mb-6">Perfil</h1>

        {/* User Info */}
        <div className="bg-card rounded-2xl p-5 shadow-sm mb-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <Input
            value={editName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
            className="text-center border-0 text-lg font-semibold bg-transparent focus-visible:ring-0 h-auto p-0"
            placeholder="Seu nome"
          />
          <p className="text-xs text-muted-foreground mt-1">{profile?.user?.email ?? ""}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Shirt, label: "Peças", value: profile?.stats?.wardrobeCount ?? 0 },
            { icon: Sparkles, label: "Looks", value: profile?.stats?.outfitCount ?? 0 },
            { icon: Heart, label: "Favoritos", value: profile?.stats?.favCount ?? 0 },
          ].map((stat: any) => (
            <div key={stat.label} className="bg-card rounded-xl p-4 shadow-sm text-center">
              <stat.icon className="w-5 h-5 mx-auto text-[#C8A96B] mb-1" />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Style Preferences */}
        <div className="bg-card rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Preferências de estilo
          </h3>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s: string) => (
              <button
                key={s}
                onClick={() => toggleStyle(s)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  (selectedStyles ?? []).includes(s) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >{s}</button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} loading={saving} className="w-full rounded-xl h-11 mb-3">
          Salvar alterações
        </Button>

        <Button
          variant="outline"
          className="w-full rounded-xl h-11 gap-2 text-destructive hover:text-destructive"
          onClick={() => signOut({ redirectTo: "/" })}
        >
          <LogOut className="w-4 h-4" /> Sair da conta
        </Button>
      </motion.div>
    </div>
  );
}
