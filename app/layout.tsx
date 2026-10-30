import type { Metadata, Viewport } from "next";
import { Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Power · Controle de Lançamentos",
  description: "Sistema de controle de lançamentos da Power",
  applicationName: "Central Power",
  // Aberto pelo atalho da tela inicial do iPhone, entra sem a barra do Safari.
  appleWebApp: { capable: true, title: "Central Power", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  // Deixa o conteúdo usar a tela toda; as sobras do entalhe e da barra do
  // iPhone são descontadas no topo e na barra de baixo.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${syne.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
