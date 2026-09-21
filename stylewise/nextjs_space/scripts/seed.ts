import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Hidden test account
  const testPassword = await bcrypt.hash("dY@5MIXB4n", 12);
  await prisma.user.upsert({
    where: { email: "abacus-924b45dd@example.com" },
    update: {},
    create: {
      email: "abacus-924b45dd@example.com",
      password: testPassword,
      name: "Test Admin",
    },
  });

  // Seed Trends (demo data for Radar de Moda)
  const trends = [
    {
      name: "Jaqueta Oversized",
      category: "Jaquetas",
      description: "Jaquetas com modelagem ampla continuam dominando o streetwear e o casual. Versão em couro sintético e nylon são as mais procuradas.",
      status: "crescendo",
      evolution: [
        { date: "2026-06-01", score: 45 },
        { date: "2026-07-01", score: 55 },
        { date: "2026-08-01", score: 68 },
        { date: "2026-09-01", score: 78 },
        { date: "2026-09-21", score: 85 },
      ],
      sources: ["Google Trends", "Vogue"],
    },
    {
      name: "Tênis Chunky",
      category: "Tênis",
      description: "Modelos com solado grosso e design robusto permanecem como peça-chave em looks casuais e streetwear.",
      status: "consolidada",
      evolution: [
        { date: "2026-06-01", score: 72 },
        { date: "2026-07-01", score: 75 },
        { date: "2026-08-01", score: 78 },
        { date: "2026-09-01", score: 80 },
        { date: "2026-09-21", score: 82 },
      ],
      sources: ["Instagram Trends", "Fashion API"],
    },
    {
      name: "Calça Cargo",
      category: "Calças",
      description: "A calça cargo voltou com força total. Versões em algodão e nylon, com bolsos laterais amplos.",
      status: "crescendo",
      evolution: [
        { date: "2026-06-01", score: 38 },
        { date: "2026-07-01", score: 50 },
        { date: "2026-08-01", score: 62 },
        { date: "2026-09-01", score: 74 },
        { date: "2026-09-21", score: 82 },
      ],
      sources: ["Pinterest", "TikTok Trends"],
    },
    {
      name: "Minimalismo Monocromático",
      category: "Estilos",
      description: "Looks em tom sobre tom, combinando peças na mesma paleta de cores. Elegante e atemporal.",
      status: "consolidada",
      evolution: [
        { date: "2026-06-01", score: 65 },
        { date: "2026-07-01", score: 68 },
        { date: "2026-08-01", score: 70 },
        { date: "2026-09-01", score: 72 },
        { date: "2026-09-21", score: 74 },
      ],
      sources: ["Vogue", "Harper's Bazaar"],
    },
    {
      name: "Acessórios Dourados",
      category: "Acessórios",
      description: "Correntes, anéis e brincos em tons dourados estão em alta para compor looks elegantes e casuais.",
      status: "estavel",
      evolution: [
        { date: "2026-06-01", score: 55 },
        { date: "2026-07-01", score: 57 },
        { date: "2026-08-01", score: 58 },
        { date: "2026-09-01", score: 56 },
        { date: "2026-09-21", score: 58 },
      ],
      sources: ["Instagram", "Google Trends"],
    },
    {
      name: "Estampa Animal Print",
      category: "Estilos",
      description: "Após anos de domínio, o animal print começa a perder espaço para estampas geométricas e florais.",
      status: "perdendo",
      evolution: [
        { date: "2026-06-01", score: 60 },
        { date: "2026-07-01", score: 52 },
        { date: "2026-08-01", score: 45 },
        { date: "2026-09-01", score: 38 },
        { date: "2026-09-21", score: 32 },
      ],
      sources: ["Fashion API", "Google Trends"],
    },
    {
      name: "Camisa de Linho",
      category: "Camisas",
      description: "Peça versátil e confortável, perfeita para o clima quente brasileiro. Combina com casual e social.",
      status: "crescendo",
      evolution: [
        { date: "2026-06-01", score: 40 },
        { date: "2026-07-01", score: 48 },
        { date: "2026-08-01", score: 58 },
        { date: "2026-09-01", score: 70 },
        { date: "2026-09-21", score: 78 },
      ],
      sources: ["Pinterest", "Vogue Brasil"],
    },
    {
      name: "Bolsa Crossbody Compacta",
      category: "Bolsas",
      description: "Bolsas pequenas com alça transversal para uso diário, práticas e estilosas.",
      status: "estavel",
      evolution: [
        { date: "2026-06-01", score: 62 },
        { date: "2026-07-01", score: 60 },
        { date: "2026-08-01", score: 63 },
        { date: "2026-09-01", score: 61 },
        { date: "2026-09-21", score: 64 },
      ],
      sources: ["Instagram", "Fashion Week"],
    },
  ];

  for (const trend of trends) {
    await prisma.trend.upsert({
      where: { id: trend.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") },
      update: {
        description: trend.description,
        status: trend.status,
        evolution: trend.evolution,
        sources: trend.sources,
        lastUpdated: new Date(),
      },
      create: {
        id: trend.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        name: trend.name,
        category: trend.category,
        description: trend.description,
        status: trend.status,
        evolution: trend.evolution,
        sources: trend.sources,
        lastUpdated: new Date(),
      },
    });
  }

  console.log("Seed completed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
