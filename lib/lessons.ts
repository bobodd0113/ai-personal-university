// 学習テーマの型です。
// id は保存や判定に使う名前、title は画面に表示する名前です。
export type Lesson = {
  id: string;
  title: string;
};

// 学部の型です。
// name は画面に表示する学部名、lessons はその学部で学ぶテーマ一覧です。
export type Faculty = {
  id: string;
  name: string;
  lessons: Lesson[];
};

// MVPで使う学部別の学習テーマ一覧です。
// テーマや学部を増やしたいときは、ここに追加していきます。
export const faculties: Faculty[] = [
  {
    id: "ai",
    name: "AI学部",
    lessons: [
      { id: "ai-001", title: "AIとは何か" },
      { id: "ai-002", title: "LLMとは何か" },
      { id: "ai-003", title: "プロンプトとは何か" },
    ],
  },
  {
    id: "investment",
    name: "投資学部",
    lessons: [
      { id: "stock-001", title: "株とは何か" },
      { id: "stock-002", title: "PERとは何か" },
      { id: "stock-003", title: "ETFとは何か" },
    ],
  },
  {
    id: "development",
    name: "開発学部",
    lessons: [
      { id: "web-001", title: "Webとは何か" },
      { id: "api-001", title: "APIとは何か" },
      { id: "next-001", title: "Next.jsとは何か" },
    ],
  },
];

// 既存のホーム画面・学習画面で使いやすいように、
// 学部別テーマを1つの配列にまとめます。
export const lessons: Lesson[] = faculties.flatMap((faculty) => faculty.lessons);

// 完了済みテーマID一覧をLocalStorageへ保存するときの名前です。
export const completedLessonIdsStorageKey =
  "ai-personal-university-completed-lesson-ids";

// テーマ一覧で選んだテーマIDをLocalStorageへ保存するときの名前です。
// これがない場合は、未完了テーマの先頭を今日のテーマとして使います。
export const selectedLessonIdStorageKey =
  "ai-personal-university-selected-lesson-id";

// getTodaysLesson は、未完了テーマの中から最初の1件を選びます。
// すべて完了している場合は null を返します。
export function getTodaysLesson(completedLessonIds: string[]) {
  return (
    lessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ?? null
  );
}
