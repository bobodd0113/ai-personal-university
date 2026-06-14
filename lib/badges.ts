// バッジの型です。
// id は保存や判定に使う名前、name は画面に表示する名前です。
export type Badge = {
  id: string;
  name: string;
  icon: string;
};

// MVPで使うバッジ一覧です。
// 将来バッジを増やすときは、この配列に追加します。
export const badges: Badge[] = [
  {
    id: "first-learning-complete",
    name: "初回学習完了",
    icon: "🏅",
  },
];

// 獲得済みバッジID一覧をLocalStorageへ保存するときの名前です。
export const earnedBadgeIdsStorageKey =
  "ai-personal-university-earned-badge-ids";

// 初回学習完了バッジのIDです。
// 学習完了時の判定で使います。
export const firstLearningCompleteBadgeId = "first-learning-complete";
