import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

// AppScreen は、スマホで読みやすい画面の共通コンテナです。
// 背景色、余白、最大幅をここにまとめます。
export function AppScreen({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
        backgroundImage:
          "linear-gradient(rgba(245, 247, 251, 0.86), rgba(245, 247, 251, 0.9)), url('/backgrounds/main-wallpaper.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        color: "#172033",
        padding: "24px 24px 112px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: "420px",
          margin: "0 auto",
        }}
      >
        {children}
      </section>
      <BottomNav />
    </main>
  );
}
