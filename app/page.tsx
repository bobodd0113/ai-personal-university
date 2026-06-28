"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppScreen } from "../components/AppScreen";
import {
  completedLessonIdsStorageKey,
  getTodaysLesson,
  lessons,
  selectedLessonIdStorageKey,
} from "../lib/lessons";
import {
  badges,
  earnedBadgeIdsStorageKey,
} from "../lib/badges";

const xpStorageKey = "ai-personal-university-xp";
const userNameStorageKey = "chino-boken-user-name";
const streakStorageKey = "ai-personal-university-streak";

type StreakData = {
  // streakDays は、連続で学習した日数です。
  streakDays: number;

  // lastStudiedDate は、最後に学習した日です。
  lastStudiedDate: string;
};

const defaultStreak: StreakData = {
  streakDays: 0,
  lastStudiedDate: "",
};

// HomePage は、アプリを開いたときに最初に表示されるホーム画面です。
// 今回は、XPとレベルをLocalStorageに保存できるようにします。
export default function HomePage() {
  const [userName, setUserName] = useState("");
  const [xp, setXp] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [streak, setStreak] = useState<StreakData>(defaultStreak);
  const level = calculateLevel(xp);
  const nextLevelXp = level * 100;
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId);
  const todaysLesson = selectedLesson ?? getTodaysLesson(completedLessonIds);
  const isTodaysLessonCompleted = todaysLesson
    ? completedLessonIds.includes(todaysLesson.id)
    : true;
  const earnedBadges = badges.filter((badge) =>
    earnedBadgeIds.includes(badge.id),
  );

  // 画面を開いたときに、保存済みXPがあれば読み込みます。
  useEffect(() => {
    const savedUserName = window.localStorage.getItem(userNameStorageKey);

    if (savedUserName) {
      setUserName(savedUserName);
    }

    const savedXp = window.localStorage.getItem(xpStorageKey);

    if (!savedXp) {
      return;
    }

    const parsedXp = Number(savedXp);

    if (Number.isFinite(parsedXp)) {
      setXp(parsedXp);
    }
  }, []);

  // 画面を開いたときに、保存済みの連続学習日数を読み込みます。
  useEffect(() => {
    const savedStreak = window.localStorage.getItem(streakStorageKey);

    if (!savedStreak) {
      return;
    }

    try {
      const parsedStreak = JSON.parse(savedStreak) as StreakData;
      setStreak({
        ...defaultStreak,
        ...parsedStreak,
      });
    } catch {
      setStreak(defaultStreak);
    }
  }, []);

  // 画面を開いたときに、獲得済みバッジID一覧を読み込みます。
  useEffect(() => {
    const savedBadgeIds = window.localStorage.getItem(earnedBadgeIdsStorageKey);

    if (!savedBadgeIds) {
      return;
    }

    try {
      const parsedBadgeIds = JSON.parse(savedBadgeIds) as string[];

      if (Array.isArray(parsedBadgeIds)) {
        setEarnedBadgeIds(parsedBadgeIds);
      }
    } catch {
      setEarnedBadgeIds([]);
    }
  }, []);

  // 画面を開いたときに、完了済みテーマID一覧を読み込みます。
  // テーマIDで管理すると、テーマが増えても判定しやすくなります。
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

  return (
    <AppScreen>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "14px",
            color: "#5d6b82",
          }}
        >
          {userName ? `${userName}さん、おかえりなさい` : "ホーム画面"}
        </p>

        <h1
          style={{
            margin: "0 0 24px",
            fontSize: "32px",
            lineHeight: "1.2",
          }}
        >
          知の冒険
        </h1>

        <section
          style={{
            border: "1px solid #d9e0ec",
            borderRadius: "8px",
            background: "#ffffff",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "14px",
              color: "#5d6b82",
            }}
          >
            現在のレベル
          </p>

          <p
            style={{
              margin: "0 0 16px",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            Lv. {level}
          </p>

          <p
            style={{
              margin: "0 0 8px",
              fontSize: "14px",
              color: "#5d6b82",
            }}
          >
            現在XP
          </p>

          <p
            style={{
              margin: "0 0 16px",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            XP {xp} / {nextLevelXp}
          </p>

          <p
            style={{
              margin: "0 0 16px",
              fontSize: "14px",
              color: "#5d6b82",
            }}
          >
            100XPごとにレベルアップします
          </p>

        </section>

        <section
          style={{
            border: "1px solid #d9e0ec",
            borderRadius: "8px",
            background: "#ffffff",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "14px",
              color: "#5d6b82",
              fontWeight: 700,
            }}
          >
            獲得済みバッジ
          </p>

          {earnedBadges.length > 0 ? (
            <div
              style={{
                display: "grid",
                gap: "8px",
              }}
            >
              {earnedBadges.map((badge) => (
                <p
                  key={badge.id}
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 700,
                  }}
                >
                  {badge.icon} {badge.name}
                </p>
              ))}
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: "15px",
                color: "#5d6b82",
              }}
            >
              まだバッジはありません
            </p>
          )}
        </section>

        <section
          style={{
            border: "1px solid #d9e0ec",
            borderRadius: "8px",
            background: "#ffffff",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            🔥 連続学習 {streak.streakDays}日
          </p>

          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#5d6b82",
            }}
          >
            最終学習日: {streak.lastStudiedDate || "まだ学習していません"}
          </p>
        </section>

        <section
          style={{
            border: "1px solid #d9e0ec",
            borderRadius: "8px",
            background: "#ffffff",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "14px",
              color: "#5d6b82",
              fontWeight: 700,
            }}
          >
            今日のテーマ
          </p>

          {todaysLesson ? (
            <>
              <h2
                style={{
                  margin: "0 0 12px",
                  fontSize: "22px",
                  lineHeight: "1.3",
                }}
              >
                {todaysLesson.title}
              </h2>

              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: "15px",
                  color: "#5d6b82",
                  fontWeight: 700,
                }}
              >
                状態: {isTodaysLessonCompleted ? "完了 ✅" : "未完了"}
              </p>

              <Link
                href="/learn"
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "8px",
                  background: "#2446d8",
                  color: "#ffffff",
                  padding: "16px",
                  fontSize: "17px",
                  fontWeight: 700,
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                学習を始める
              </Link>
            </>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: "17px",
                color: "#1b7f45",
                fontWeight: 700,
                lineHeight: "1.6",
              }}
            >
              すべてのテーマを完了しました
            </p>
          )}
        </section>

        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          <NavigationLink href="/learn" label="学習画面へ" />
          <NavigationLink href="/teacher" label="AI先生設定画面へ" />
        </div>
    </AppScreen>
  );
}

// calculateLevel は、XPからレベルを計算する関数です。
// 今はMVP用に、100XPごとに1レベル上がる単純なルールにしています。
function calculateLevel(xp: number) {
  if (xp >= 200) {
    return 3;
  }

  if (xp >= 100) {
    return 2;
  }

  return 1;
}

// NavigationLink は、別の画面へ移動するためのリンクです。
// href が移動先、label が画面に表示する文字です。
function NavigationLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        border: "1px solid #d9e0ec",
        borderRadius: "8px",
        background: "#ffffff",
        padding: "16px",
        color: "#172033",
        fontSize: "17px",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
}
