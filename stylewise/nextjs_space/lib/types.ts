export interface WardrobeItemType {
  id: string;
  userId: string;
  imageUrl: string;
  cloudStoragePath: string | null;
  isPublic: boolean;
  category: string;
  color: string;
  pattern: string | null;
  style: string | null;
  brand: string | null;
  season: string | null;
  aiAnalysis: any;
  createdAt: string;
  updatedAt: string;
}

export interface OutfitType {
  id: string;
  userId: string;
  name: string | null;
  occasion: string | null;
  style: string | null;
  explanation: string | null;
  weather: any;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  items: OutfitItemType[];
  isFavorited?: boolean;
  rating?: boolean | null;
}

export interface OutfitItemType {
  id: string;
  outfitId: string;
  wardrobeItemId: string;
  wardrobeItem: WardrobeItemType;
  order: number;
}

export interface TrendType {
  id: string;
  name: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  evolution: Array<{ date: string; score: number }>;
  sources: string[];
  lastUpdated: string;
  createdAt: string;
}

export interface LookAnalysis {
  scores: {
    combination: number;
    colors: number;
    style: number;
  };
  whatWorks: string[];
  improvements: string[];
  suggestion: string;
  detectedItems: Array<{ category: string; color: string }>;
}

export const CATEGORIES = [
  "Todas",
  "Camisetas",
  "Camisas",
  "Blusas",
  "Jaquetas",
  "Casacos",
  "Calças",
  "Shorts",
  "Saias",
  "Vestidos",
  "Tênis",
  "Sapatos",
  "Sandálias",
  "Bolsas",
  "Acessórios",
  "Outros",
] as const;

export const OCCASIONS = [
  "Casual",
  "Trabalho",
  "Festa",
  "Encontro",
  "Esporte",
  "Praia",
  "Formal",
  "Viagem",
] as const;

export const STYLES = [
  "Casual",
  "Streetwear",
  "Elegante",
  "Esportivo",
  "Minimalista",
  "Boho",
  "Clássico",
  "Romântico",
] as const;

export const TREND_STATUSES = {
  crescendo: { label: "Crescendo", emoji: "🔥", color: "#FF6B6B" },
  consolidada: { label: "Consolidada", emoji: "🟢", color: "#4CAF50" },
  estavel: { label: "Estável", emoji: "🟡", color: "#FFC107" },
  perdendo: { label: "Perdendo força", emoji: "🔴", color: "#F44336" },
} as const;
