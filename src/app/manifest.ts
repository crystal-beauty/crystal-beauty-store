import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?admin=1&app=crystal_beauty",
    name: "Crystal Beauty — Admin",
    short_name: "Crystal Admin",
    description: "Tableau de bord et gestion des commandes Crystal Beauty",
    start_url: "/?admin=1",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a1f44",
    theme_color: "#0a1f44",
    icons: [
      {
        src: "/crystal-beauty-logo.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/crystal-beauty-logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
