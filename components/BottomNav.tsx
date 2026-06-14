"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/learn", label: "学習" },
  { href: "/themes", label: "テーマ" },
  { href: "/teacher", label: "AI先生" },
];

// BottomNav は、スマホで画面を行き来しやすくする下部ナビゲーションです。
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="画面下部ナビゲーション"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        borderTop: "1px solid #d9e0ec",
        background: "#ffffff",
        padding: "8px 12px",
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
          maxWidth: "420px",
          margin: "0 auto",
        }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              style={{
                display: "grid",
                placeItems: "center",
                minHeight: "48px",
                borderRadius: "8px",
                background: isActive ? "#2446d8" : "#f5f7fb",
                color: isActive ? "#ffffff" : "#172033",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
