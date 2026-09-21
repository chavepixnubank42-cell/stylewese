import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { ChunkLoadErrorHandler } from "@/components/chunk-load-error-handler";

export const dynamic = "force-dynamic";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: "STYLEWISE — Seu estilo. Sua inteligência.",
  description:
    "Personal stylist digital com IA. Organize seu guarda-roupa, receba análises de looks e descubra combinações inteligentes.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "STYLEWISE — Seu estilo. Sua inteligência.",
    description:
      "Personal stylist digital com IA que aprende seu estilo e transforma seu guarda-roupa.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className="font-sans">
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
          <ChunkLoadErrorHandler />
        </Providers>
      </body>
    </html>
  );
}
