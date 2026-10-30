import type { MetadataRoute } from "next";

// O que faz a Central virar "aplicativo" ao ser colocada na tela inicial.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Central Power",
    short_name: "Central Power",
    description: "Sistema de controle de lançamentos da Power",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#1a1a1a",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/icone-mascara-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
