import type { Metadata, Viewport } from "next";

// metadata は、ブラウザのタブ名などに使われるアプリ情報です。
// ここではアプリ名と説明文を設定しています。
export const metadata: Metadata = {
  title: "知の冒険",
  description: "毎日少しずつ学ぶ、自分専用の知識育成アプリ",
  manifest: "/manifest.webmanifest",
};

// viewport は、スマホ表示やブラウザのテーマ色に関する設定です。
// Next.jsでは themeColor を metadata ではなく viewport に書く形が推奨されています。
export const viewport: Viewport = {
  themeColor: "#111827",
};

// RootLayout は、すべての画面に共通する一番外側の枠です。
// Next.js の App Router では、このファイルが必ず必要になります。
export default function RootLayout({
  children,
}: {
  // children には、各ページの中身が入ります。
  // たとえば app/page.tsx の内容がここに差し込まれます。
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
