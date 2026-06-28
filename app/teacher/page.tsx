"use client";

import { useEffect, useState } from "react";
import {
  defaultTeacherProfile,
  teacherProfileStorageKey,
  type TeacherProfile,
} from "../../lib/teacher";
import { AppScreen } from "../../components/AppScreen";
import {
  completedLessonIdsStorageKey,
  selectedLessonIdStorageKey,
} from "../../lib/lessons";
import { earnedBadgeIdsStorageKey } from "../../lib/badges";

const xpStorageKey = "ai-personal-university-xp";
const userNameStorageKey = "chino-boken-user-name";
const streakStorageKey = "ai-personal-university-streak";
const oldChatStorageKey = "ai-personal-university-chat-history";
const chatByLessonStorageKey = "ai-personal-university-chat-history-by-lesson";
const learningSummaryStorageKey =
  "ai-personal-university-learning-summary-by-lesson";

// AI先生設定画面です。
// 入力したプロフィールを LocalStorage に保存します。
export default function TeacherSettingsPage() {
  const [teacher, setTeacher] = useState<TeacherProfile>(defaultTeacherProfile);
  const [userName, setUserName] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  // 画面を開いたときに、保存済みの先生設定があれば読み込みます。
  // 保存済みデータがない初回起動時は defaultTeacherProfile を使います。
  useEffect(() => {
    const savedUserName = window.localStorage.getItem(userNameStorageKey);

    if (savedUserName) {
      setUserName(savedUserName);
    }

    const savedTeacher = window.localStorage.getItem(teacherProfileStorageKey);

    if (!savedTeacher) {
      return;
    }

    try {
      const parsedTeacher = JSON.parse(savedTeacher) as TeacherProfile;
      setTeacher({
        ...defaultTeacherProfile,
        ...parsedTeacher,
      });
    } catch {
      setTeacher(defaultTeacherProfile);
    }
  }, []);

  // 入力欄が変更されたときに、teacher の中身を更新します。
  function updateTeacherProfile(field: keyof TeacherProfile, value: string) {
    setTeacher((currentTeacher) => ({
      ...currentTeacher,
      [field]: value,
    }));
  }

  // 保存ボタンを押したときに、LocalStorage へ保存します。
  function saveTeacherProfile() {
    const trimmedUserName = userName.trim();

    if (trimmedUserName) {
      window.localStorage.setItem(userNameStorageKey, trimmedUserName);
    } else {
      window.localStorage.removeItem(userNameStorageKey);
    }

    window.localStorage.setItem(
      teacherProfileStorageKey,
      JSON.stringify(teacher),
    );
    setSavedMessage("保存しました");
  }

  // 学習データだけをリセットします。
  // AI先生プロフィールはユーザーが作ったキャラクターなので削除しません。
  function resetLearningData() {
    const shouldReset = window.confirm(
      "XP、テーマ完了、連続学習、バッジ、チャット履歴をリセットしますか？AI先生プロフィールは残ります。",
    );

    if (!shouldReset) {
      return;
    }

    window.localStorage.removeItem(xpStorageKey);
    window.localStorage.removeItem(completedLessonIdsStorageKey);
    window.localStorage.removeItem(streakStorageKey);
    window.localStorage.removeItem(earnedBadgeIdsStorageKey);
    window.localStorage.removeItem(oldChatStorageKey);
    window.localStorage.removeItem(chatByLessonStorageKey);
    window.localStorage.removeItem(learningSummaryStorageKey);
    window.localStorage.removeItem(selectedLessonIdStorageKey);
    window.location.href = "/";
  }

  return (
    <AppScreen>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: "14px",
            color: "#5d6b82",
          }}
        >
          AI先生設定
        </p>

        <h1
          style={{
            margin: "0 0 16px",
            fontSize: "30px",
            lineHeight: "1.2",
          }}
        >
          {teacher.icon} {teacher.name}先生
        </h1>

        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >
          <TextInput
            label="ユーザー名"
            value={userName}
            onChange={setUserName}
          />
          <TextInput
            label="名前"
            value={teacher.name}
            onChange={(value) => updateTeacherProfile("name", value)}
          />
          <TextInput
            label="一人称"
            value={teacher.firstPerson}
            onChange={(value) => updateTeacherProfile("firstPerson", value)}
          />
          <TextInput
            label="性格"
            value={teacher.personality}
            onChange={(value) => updateTeacherProfile("personality", value)}
          />
          <TextInput
            label="口調"
            value={teacher.tone}
            onChange={(value) => updateTeacherProfile("tone", value)}
          />
          <TextInput
            label="教え方"
            value={teacher.teachingStyle}
            onChange={(value) => updateTeacherProfile("teachingStyle", value)}
          />
          <TextInput
            label="励まし方"
            value={teacher.encouragementStyle}
            onChange={(value) =>
              updateTeacherProfile("encouragementStyle", value)
            }
          />
          <TextInput
            label="アイコン（絵文字・画像未設定時に使います）"
            value={teacher.icon}
            onChange={(value) => updateTeacherProfile("icon", value)}
          />
          <TextInput
            label="アイコン画像パス（例: /teachers/main-teacher.png）"
            value={teacher.iconImage}
            onChange={(value) => updateTeacherProfile("iconImage", value)}
          />

          <button
            type="button"
            onClick={saveTeacherProfile}
            style={{
              border: "0",
              borderRadius: "8px",
              background: "#2446d8",
              color: "#ffffff",
              padding: "16px",
              fontSize: "17px",
              fontWeight: 700,
            }}
          >
            保存する
          </button>

          {savedMessage ? (
            <p
              style={{
                margin: 0,
                color: "#1b7f45",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {savedMessage}
            </p>
          ) : null}

          <div
            style={{
              borderTop: "1px solid #d9e0ec",
              marginTop: "12px",
              paddingTop: "16px",
            }}
          >
            <button
              type="button"
              onClick={resetLearningData}
              style={{
                width: "100%",
                border: "1px solid #f0b4b4",
                borderRadius: "8px",
                background: "#fff5f5",
                color: "#b42318",
                padding: "14px",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              学習データをリセット
            </button>
          </div>
        </div>
    </AppScreen>
  );
}

// TextInput は、先生プロフィールを入力するための部品です。
// value が現在の文字、onChange が文字を変更したときの処理です。
function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: "6px",
        border: "1px solid #d9e0ec",
        borderRadius: "8px",
        background: "#ffffff",
        padding: "14px",
      }}
    >
      <span
        style={{
          fontSize: "13px",
          color: "#5d6b82",
          fontWeight: 600,
        }}
      >
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          border: "1px solid #c9d3e3",
          borderRadius: "8px",
          padding: "12px",
          color: "#172033",
          fontSize: "16px",
        }}
      />
    </label>
  );
}
