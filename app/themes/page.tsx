"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppScreen } from "../../components/AppScreen";
import {
  completedLessonIdsStorageKey,
  faculties,
  getTodaysLesson,
  lessons,
  selectedLessonIdStorageKey,
} from "../../lib/lessons";

const learningSummaryStorageKey =
  "ai-personal-university-learning-summary-by-lesson";
type LearningSummaryByLesson = Record<string, string>;

// テーマ一覧画面です。
// 学部ごとのテーマ、完了状態、現在のテーマ、進捗を表示します。
export default function ThemesPage() {
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [learningSummaries, setLearningSummaries] =
    useState<LearningSummaryByLesson>({});
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId);
  const todaysLesson = selectedLesson ?? getTodaysLesson(completedLessonIds);
  const completedLessonCount = lessons.filter((lesson) =>
    completedLessonIds.includes(lesson.id),
  ).length;
  const totalLessonCount = lessons.length;
  const progressPercent =
    totalLessonCount > 0
      ? Math.round((completedLessonCount / totalLessonCount) * 100)
      : 0;

  // 学習画面で保存した完了済みテーマID一覧を読み込みます。
  useEffect(() => {
    const savedSelectedLessonId = window.localStorage.getItem(
      selectedLessonIdStorageKey,
    );
    const selectedLessonExists = lessons.some(
      (lesson) => lesson.id === savedSelectedLessonId,
    );

    setSelectedLessonId(
      savedSelectedLessonId && selectedLessonExists ? savedSelectedLessonId : null,
    );

    const savedCompletedLessonIds = window.localStorage.getItem(
      completedLessonIdsStorageKey,
    );

    if (!savedCompletedLessonIds) {
      return;
    }

    try {
      const parsedCompletedLessonIds = JSON.parse(
        savedCompletedLessonIds,
      ) as string[];

      if (Array.isArray(parsedCompletedLessonIds)) {
        setCompletedLessonIds(parsedCompletedLessonIds);
      }
    } catch {
      setCompletedLessonIds([]);
    }
  }, []);

  // 保存済みの「今日の学びまとめ」を読み込みます。
  useEffect(() => {
    const savedSummaries = window.localStorage.getItem(learningSummaryStorageKey);

    if (!savedSummaries) {
      return;
    }

    try {
      const parsedSummaries = JSON.parse(
        savedSummaries,
      ) as LearningSummaryByLesson;

      setLearningSummaries(parsedSummaries);
    } catch {
      setLearningSummaries({});
    }
  }, []);

  return (
    <AppScreen>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: "14px",
          color: "#5d6b82",
        }}
      >
        学習ルート
      </p>

      <h1
        style={{
          margin: "0 0 20px",
          fontSize: "30px",
          lineHeight: "1.2",
        }}
      >
        テーマ一覧
      </h1>

      <section
        style={{
          border: "1px solid #d9e0ec",
          borderRadius: "8px",
          background: "#ffffff",
          padding: "16px",
          marginBottom: "16px",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "16px",
            fontWeight: 700,
          }}
        >
          {totalLessonCount}テーマ中 {completedLessonCount}テーマ完了
        </p>

        <p
          style={{
            margin: "0 0 12px",
            fontSize: "14px",
            color: "#5d6b82",
            fontWeight: 700,
          }}
        >
          進捗 {progressPercent}%
        </p>

        <ProgressBar percent={progressPercent} label="全体の進捗" />
      </section>

      <div
        style={{
          display: "grid",
          gap: "16px",
        }}
      >
        {faculties.map((faculty) => (
          <FacultySection
            key={faculty.id}
            faculty={faculty}
            completedLessonIds={completedLessonIds}
            todaysLessonId={todaysLesson?.id}
            selectedLessonId={selectedLessonId}
            learningSummaries={learningSummaries}
          />
        ))}
      </div>
    </AppScreen>
  );
}

function FacultySection({
  faculty,
  completedLessonIds,
  todaysLessonId,
  selectedLessonId,
  learningSummaries,
}: {
  faculty: (typeof faculties)[number];
  completedLessonIds: string[];
  todaysLessonId?: string;
  selectedLessonId: string | null;
  learningSummaries: LearningSummaryByLesson;
}) {
  const completedCount = faculty.lessons.filter((lesson) =>
    completedLessonIds.includes(lesson.id),
  ).length;
  const totalCount = faculty.lessons.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section
      style={{
        border: "1px solid #d9e0ec",
        borderRadius: "8px",
        background: "#ffffff",
        padding: "16px",
      }}
    >
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "21px",
        }}
      >
        {faculty.name}
      </h2>

      <p
        style={{
          margin: "0 0 6px",
          fontSize: "14px",
          color: "#5d6b82",
          fontWeight: 700,
        }}
      >
        {completedCount} / {totalCount} 完了
      </p>

      <p
        style={{
          margin: "0 0 10px",
          fontSize: "14px",
          color: "#5d6b82",
          fontWeight: 700,
        }}
      >
        進捗 {progressPercent}%
      </p>

      <div style={{ marginBottom: "14px" }}>
        <ProgressBar percent={progressPercent} label={`${faculty.name}の進捗`} />
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
        }}
      >
        {faculty.lessons.map((lesson) => {
          const isCompleted = completedLessonIds.includes(lesson.id);
          const isTodaysLesson = todaysLessonId === lesson.id;
          const isSelectedLesson = selectedLessonId === lesson.id;
          const lessonSummary = learningSummaries[lesson.id];
          const lessonLabel = isSelectedLesson
            ? "選択中"
            : isTodaysLesson
              ? "今日のテーマ"
              : "";

          return (
            <div
              key={lesson.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                border: "1px solid #edf1f7",
                borderRadius: "8px",
                background: isTodaysLesson ? "#eef3ff" : "#ffffff",
                padding: "12px",
              }}
            >
              <div>
                <p
                  style={{
                    margin: isTodaysLesson ? "0 0 4px" : 0,
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: "1.5",
                  }}
                >
                  {isCompleted ? "✅" : isTodaysLesson ? "📌" : "□"}{" "}
                  {lesson.title}
                </p>

                {lessonLabel ? (
                  <p
                    style={{
                      margin: 0,
                      color: isSelectedLesson ? "#7c3aed" : "#2446d8",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {isSelectedLesson ? "📌 " : ""}
                    {lessonLabel}
                  </p>
                ) : null}
              </div>

              <span
                style={{
                  flex: "0 0 auto",
                  borderRadius: "8px",
                  background: isCompleted ? "#e8f8ee" : "#f5f7fb",
                  color: isCompleted ? "#1b7f45" : "#5d6b82",
                  padding: "6px 10px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                {isCompleted ? "完了" : "未完了"}
              </span>

              <Link
                href="/learn"
                onClick={() => {
                  window.localStorage.setItem(
                    selectedLessonIdStorageKey,
                    lesson.id,
                  );
                }}
                style={{
                  flex: "0 0 auto",
                  borderRadius: "8px",
                  background: "#2446d8",
                  color: "#ffffff",
                  padding: "8px 10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                学習する
              </Link>

              {isCompleted ? (
                <div
                  style={{
                    flexBasis: "100%",
                    borderTop: "1px solid #edf1f7",
                    marginTop: "4px",
                    paddingTop: "10px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 6px",
                      color: "#5d6b82",
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    学びまとめ
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#172033",
                      fontSize: "14px",
                      lineHeight: "1.7",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {lessonSummary || "まとめはまだありません"}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      aria-label={`${label} ${percent}%`}
      style={{
        height: "10px",
        borderRadius: "8px",
        background: "#edf1f7",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: "100%",
          background: "#2446d8",
        }}
      />
    </div>
  );
}
