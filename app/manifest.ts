import type { MetadataRoute } from "next";

// manifest は、スマホに「アプリとして追加」するときの情報です。
// まずはPWAの最小構成として、名前・色・起動URLなどを設定します。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "知の冒険",
    short_name: "知の冒険",
    description: "AI先生と一緒に学ぶ、自分専用の学習RPG",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
