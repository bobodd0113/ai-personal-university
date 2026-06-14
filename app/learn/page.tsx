"use client";

import { useEffect, useRef, useState } from "react";
import {
  defaultTeacherProfile,
  teacherProfileStorageKey,
  type TeacherProfile,
} from "../../lib/teacher";
import { AppScreen } from "../../components/AppScreen";
import {
  completedLessonIdsStorageKey,
  getTodaysLesson,
  lessons,
  selectedLessonIdStorageKey,
} from "../../lib/lessons";
import {
  earnedBadgeIdsStorageKey,
  firstLearningCompleteBadgeId,
} from "../../lib/badges";

const xpStorageKey = "ai-personal-university-xp";
const chatStorageKey = "ai-personal-university-chat-history";
const chatByLessonStorageKey = "ai-personal-university-chat-history-by-lesson";
const learningSummaryStorageKey =
  "ai-personal-university-learning-summary-by-lesson";
const streakStorageKey = "ai-personal-university-streak";

// ChatMessage は、チャットに表示する1つのメッセージの型です。
type ChatMessage = {
  // id は、画面に一覧表示するときに使う目印です。
  id: number;

  // role は、誰のメッセージかを表します。
  // Gemini APIに接続するときも、この考え方を再利用できます。
  role: "user" | "teacher" | "system";

  // message は、実際に表示する文章です。
  message: string;

  // timestamp は、メッセージが作られた時刻です。
  timestamp: string;
};

// ChatHistoryByLesson は、テーマIDごとにチャット履歴を保存するための型です。
// 例: { "ai-001": [メッセージ一覧], "stock-001": [メッセージ一覧] }
type ChatHistoryByLesson = Record<string, ChatMessage[]>;
type LearningSummaryByLesson = Record<string, string>;

// 学習画面です。
// LocalStorage から保存済みのAI先生設定を読み込み、画面上部に表示します。
export default function LearnPage() {
  const isCompletingRef = useRef(false);
  const [teacher, setTeacher] = useState<TeacherProfile>(defaultTeacherProfile);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [hasSelectedLesson, setHasSelectedLesson] = useState(false);
  const [inputText, setInputText] = useState("");
  const [completionMessages, setCompletionMessages] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [learningSummary, setLearningSummary] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const nextTodaysLesson = getTodaysLesson(completedLessonIds);
  const todaysLesson =
    lessons.find((lesson) => lesson.id === activeLessonId) ?? nextTodaysLesson;
  const isTodaysLessonCompleted = todaysLesson
    ? completedLessonIds.includes(todaysLesson.id)
    : true;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "teacher",
      message: `${defaultTeacherProfile.name}です。今日は一緒に、少しずつ学んでいきましょう。`,
      timestamp: new Date().toISOString(),
    },
  ]);

  // 画面を開いたときに、ブラウザ内に保存されたAI先生設定を読み込みます。
  // 保存データがない場合は、defaultTeacherProfile のまま表示します。
  useEffect(() => {
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

  // 今日のテーマが決まったら、そのテーマ専用のチャット履歴を読み込みます。
  // 古い全体チャット履歴がある場合は、今のテーマの履歴として一度だけ使います。
  useEffect(() => {
    if (!todaysLesson) {
      setMessages([]);
      return;
    }

    const savedHistoryByLesson = window.localStorage.getItem(
      chatByLessonStorageKey,
    );

    if (savedHistoryByLesson) {
      try {
        const parsedHistoryByLesson = JSON.parse(
          savedHistoryByLesson,
        ) as ChatHistoryByLesson;
        const lessonMessages = parsedHistoryByLesson[todaysLesson.id];

        setMessages(
          Array.isArray(lessonMessages)
            ? lessonMessages
            : [createInitialTeacherMessage(teacher.name)],
        );
        return;
      } catch {
        window.localStorage.removeItem(chatByLessonStorageKey);
      }
    }

    const oldSavedMessages = window.localStorage.getItem(chatStorageKey);

    if (!oldSavedMessages) {
      setMessages([createInitialTeacherMessage(teacher.name)]);
      return;
    }

    try {
      const parsedMessages = JSON.parse(oldSavedMessages) as ChatMessage[];

      if (Array.isArray(parsedMessages)) {
        setMessages(parsedMessages);
        saveMessagesForLesson(todaysLesson.id, parsedMessages);
        window.localStorage.removeItem(chatStorageKey);
      }
    } catch {
      window.localStorage.removeItem(chatStorageKey);
      setMessages([createInitialTeacherMessage(teacher.name)]);
    }
  }, [todaysLesson?.id, teacher.name]);

  // 今日のテーマが決まったら、そのテーマの学びまとめを読み込みます。
  useEffect(() => {
    if (!todaysLesson) {
      setLearningSummary("");
      return;
    }

    setLearningSummary(loadLearningSummary(todaysLesson.id));
  }, [todaysLesson?.id]);

  // 画面を開いたときに、完了済みテーマID一覧を読み込みます。
  // 今後テーマが増えても、この一覧で完了状態を判定できます。
  useEffect(() => {
    setHasSelectedLesson(hasValidSelectedLesson());

    const savedCompletedLessonIds = window.localStorage.getItem(
      completedLessonIdsStorageKey,
    );

    if (!savedCompletedLessonIds) {
      setActiveLessonId(getInitialLessonId([]));
      return;
    }

    try {
      const parsedCompletedLessonIds = JSON.parse(
        savedCompletedLessonIds,
      ) as string[];

      if (Array.isArray(parsedCompletedLessonIds)) {
        setCompletedLessonIds(parsedCompletedLessonIds);
        setActiveLessonId(getInitialLessonId(parsedCompletedLessonIds));
      }
    } catch {
      setCompletedLessonIds([]);
      setActiveLessonId(getInitialLessonId([]));
    }
  }, []);

  // 送信ボタンを押したときの処理です。
  // 今はGemini APIを使わず、先生設定をもとにしたダミー返答を追加します。
  async function sendMessage() {
    if (!todaysLesson || isSending) {
      return;
    }

    const trimmedText = inputText.trim();

    if (!trimmedText) {
      return;
    }

    setIsSending(true);
    setChatError("");

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      message: trimmedText,
      timestamp: new Date().toISOString(),
    };

    let teacherMessage: ChatMessage;

    try {
      teacherMessage = {
        id: Date.now() + 1,
        role: "teacher",
        message: await requestGeminiReply({
          teacher,
          lessonTitle: todaysLesson.title,
          userMessage: trimmedText,
          messages,
        }),
        timestamp: new Date().toISOString(),
      };
    } catch {
      setChatError(
        "Geminiとの接続に失敗しました。少し時間をおいて、もう一度送信してください。",
      );
      teacherMessage = {
        id: Date.now() + 1,
        role: "system",
        message:
          "Geminiとの接続に失敗しました。少し時間をおいて、もう一度送信してください。",
        timestamp: new Date().toISOString(),
      };
    }

    setMessages((currentMessages) => {
      const nextMessages = [...currentMessages, userMessage, teacherMessage];
      if (todaysLesson) {
        saveMessagesForLesson(todaysLesson.id, nextMessages);
      }
      return nextMessages;
    });
    setInputText("");
    setIsSending(false);
  }

  // 現在のテーマだけ、保存済みチャット履歴を削除します。
  // 他テーマの履歴は残すため、テーマIDを指定してその場所だけ消します。
  function clearCurrentLessonMessages() {
    if (!todaysLesson) {
      return;
    }

    const shouldClear = window.confirm(
      "このテーマのチャット履歴をクリアしますか？",
    );

    if (!shouldClear) {
      return;
    }

    const savedHistoryByLesson = window.localStorage.getItem(
      chatByLessonStorageKey,
    );
    let historyByLesson: ChatHistoryByLesson = {};

    try {
      historyByLesson = savedHistoryByLesson
        ? JSON.parse(savedHistoryByLesson)
        : {};
    } catch {
      historyByLesson = {};
    }

    delete historyByLesson[todaysLesson.id];

    window.localStorage.setItem(
      chatByLessonStorageKey,
      JSON.stringify(historyByLesson),
    );
    setMessages([]);
  }

  // テーマ一覧で選んだテーマを解除し、未完了テーマの先頭へ戻します。
  function resetSelectedLesson() {
    window.localStorage.removeItem(selectedLessonIdStorageKey);
    setHasSelectedLesson(false);
    setActiveLessonId(getTodaysLesson(completedLessonIds)?.id ?? null);
  }

  // 学習完了ボタンを押したときに、LocalStorage のXPを10増やします。
  // 今後、メッセージ送信XPやクイズXPもこの考え方で追加できます。
  async function completeLearning() {
    if (
      !todaysLesson ||
      completedLessonIds.includes(todaysLesson.id) ||
      isCompletingRef.current
    ) {
      return;
    }

    isCompletingRef.current = true;

    addXp(10);
    updateStreak();
    const nextCompletedLessonIds = completeLesson();
    earnFirstLearningBadge();

    const nextLesson = getTodaysLesson(nextCompletedLessonIds);

    setCompletionMessages(
      nextLesson
        ? [
            "テーマを完了しました！",
            "+10XPを獲得しました！",
            "次のテーマが解放されました！",
          ]
        : [
            "テーマを完了しました！",
            "+10XPを獲得しました！",
            "すべてのテーマを完了しました！",
        ],
    );

    setIsSummaryLoading(true);

    try {
      const summary = await requestLearningSummary({
        lessonTitle: todaysLesson.title,
        messages,
      });

      setLearningSummary(summary);
      saveLearningSummary(todaysLesson.id, summary);
    } catch {
      setLearningSummary("");
    } finally {
      setIsSummaryLoading(false);
    }

    window.setTimeout(() => {
      isCompletingRef.current = false;
    }, 0);
  }

  // 今日のテーマを完了状態にして、LocalStorageへ保存します。
  function completeLesson() {
    if (!todaysLesson || completedLessonIds.includes(todaysLesson.id)) {
      return completedLessonIds;
    }

    const nextCompletedLessonIds = [...completedLessonIds, todaysLesson.id];

    setCompletedLessonIds(nextCompletedLessonIds);
    window.localStorage.setItem(
      completedLessonIdsStorageKey,
      JSON.stringify(nextCompletedLessonIds),
    );

    return nextCompletedLessonIds;
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
          学習
        </p>

        <h1
          style={{
            margin: "0 0 20px",
            fontSize: "30px",
            lineHeight: "1.2",
          }}
        >
          学習画面
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
              fontSize: "14px",
              color: "#5d6b82",
              fontWeight: 700,
            }}
          >
            今日のテーマ
          </p>

          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "22px",
              lineHeight: "1.3",
            }}
          >
            {todaysLesson ? todaysLesson.title : "すべてのテーマを完了しました"}
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#5d6b82",
            }}
          >
            状態: {todaysLesson ? "未完了" : "完了"}
          </p>
        </section>

        {hasSelectedLesson ? (
          <button
            type="button"
            onClick={resetSelectedLesson}
            style={{
              width: "100%",
              border: "1px solid #d9e0ec",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#2446d8",
              padding: "14px",
              fontSize: "15px",
              fontWeight: 700,
              marginBottom: "16px",
            }}
          >
            通常の今日のテーマに戻す
          </button>
        ) : null}

        <section
          style={{
            border: "1px solid #d9e0ec",
            borderRadius: "8px",
            background: "#ffffff",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <span
              aria-label="AI先生アイコン"
              style={{
                display: "grid",
                placeItems: "center",
                width: "48px",
                height: "48px",
                borderRadius: "8px",
                background: "#eef3ff",
                fontSize: "28px",
              }}
            >
              {teacher.icon}
            </span>

            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: "13px",
                  color: "#5d6b82",
                }}
              >
                今日のAI先生
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: 700,
                }}
              >
                {teacher.name}先生
              </p>
            </div>
          </div>

          <TeacherInfo label="性格" value={teacher.personality} />
          <TeacherInfo label="口調" value={teacher.tone} />
          <TeacherInfo label="教え方" value={teacher.teachingStyle} />
        </section>

        <section
          style={{
            marginTop: "16px",
            display: "grid",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                teacherName={teacher.name}
              />
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gap: "8px",
              border: "1px solid #d9e0ec",
              borderRadius: "8px",
              background: "#ffffff",
              padding: "12px",
            }}
          >
            <input
              value={inputText}
              disabled={isSending}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !isSending) {
                  sendMessage();
                }
              }}
              placeholder="学びたいことを入力"
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #c9d3e3",
                borderRadius: "8px",
                padding: "12px",
                color: "#172033",
                background: isSending ? "#f5f7fb" : "#ffffff",
                fontSize: "16px",
              }}
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={isSending}
              style={{
                border: "0",
                borderRadius: "8px",
                background: isSending ? "#9aa6b8" : "#2446d8",
                color: "#ffffff",
                padding: "14px",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              {isSending ? "送信中..." : "送信"}
            </button>
          </div>

          {isSending ? (
            <p
              style={{
                margin: 0,
                color: "#2446d8",
                fontSize: "14px",
                fontWeight: 700,
                lineHeight: "1.5",
              }}
            >
              {teacher.name}先生が考え中...
            </p>
          ) : null}

          {chatError ? (
            <p
              style={{
                margin: 0,
                color: "#b42318",
                fontSize: "14px",
                fontWeight: 700,
                lineHeight: "1.5",
              }}
            >
              {chatError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={clearCurrentLessonMessages}
            disabled={!todaysLesson}
            style={{
              border: "1px solid #d9e0ec",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#5d6b82",
              padding: "14px",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            このテーマの履歴をクリア
          </button>

          <button
            type="button"
            onClick={completeLearning}
            disabled={!todaysLesson || isTodaysLessonCompleted}
            style={{
              border: "0",
              borderRadius: "8px",
              background:
                todaysLesson && !isTodaysLessonCompleted
                  ? "#1b7f45"
                  : "#9aa6b8",
              color: "#ffffff",
              padding: "16px",
              fontSize: "17px",
              fontWeight: 700,
            }}
          >
            {todaysLesson && !isTodaysLessonCompleted
              ? "学習完了 +10XP"
              : "完了済み ✅"}
          </button>

          {completionMessages.length > 0 ? (
            <div
              style={{
                border: "1px solid #b9e4ca",
                borderRadius: "8px",
                background: "#f0fff5",
                padding: "14px",
              }}
            >
              {completionMessages.map((message) => (
                <p
                  key={message}
                  style={{
                    margin: "0 0 6px",
                    color: "#1b7f45",
                    fontSize: "15px",
                    fontWeight: 700,
                    lineHeight: "1.5",
                  }}
                >
                  {message}
                </p>
              ))}
            </div>
          ) : null}

          {(isSummaryLoading || learningSummary) ? (
            <section
              style={{
                border: "1px solid #d9e0ec",
                borderRadius: "8px",
                background: "#ffffff",
                padding: "16px",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                今日の学び
              </p>

              <p
                style={{
                  margin: 0,
                  color: "#172033",
                  fontSize: "15px",
                  lineHeight: "1.7",
                  whiteSpace: "pre-wrap",
                }}
              >
                {isSummaryLoading ? "まとめを作成中..." : learningSummary}
              </p>
            </section>
          ) : null}
        </section>
    </AppScreen>
  );
}

// TeacherInfo は、先生情報を1行で表示するための小さな部品です。
function TeacherInfo({ label, value }: { label: string; value: string }) {
  return (
    <p
      style={{
        margin: "0 0 10px",
        fontSize: "15px",
        lineHeight: "1.6",
      }}
    >
      <span
        style={{
          color: "#5d6b82",
          fontWeight: 700,
        }}
      >
        {label}:
      </span>{" "}
      {value}
    </p>
  );
}

// ChatBubble は、チャットの吹き出しを表示する部品です。
function ChatBubble({
  message,
  teacherName,
}: {
  message: ChatMessage;
  teacherName: string;
}) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      style={{
        justifySelf: isUser ? "end" : "start",
        maxWidth: "85%",
        border: isSystem ? "1px solid #f0b4b4" : "1px solid #d9e0ec",
        borderRadius: "8px",
        background: isUser ? "#2446d8" : isSystem ? "#fff5f5" : "#ffffff",
        color: isUser ? "#ffffff" : isSystem ? "#b42318" : "#172033",
        padding: "12px",
      }}
    >
      <p
        style={{
          margin: "0 0 4px",
          fontSize: "12px",
          color: isUser ? "#dbe5ff" : isSystem ? "#b42318" : "#5d6b82",
          fontWeight: 700,
        }}
      >
        {isUser ? "あなた" : isSystem ? "システム" : teacherName}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "15px",
          lineHeight: "1.6",
        }}
      >
        {message.message}
      </p>
    </div>
  );
}

// getInitialLessonId は、学習画面を開いたときに表示するテーマIDを決めます。
// テーマ一覧で選択したIDがあればそれを優先し、なければ未完了テーマの先頭を使います。
function getInitialLessonId(completedLessonIds: string[]) {
  const selectedLessonId = window.localStorage.getItem(selectedLessonIdStorageKey);
  const selectedLessonExists = lessons.some(
    (lesson) => lesson.id === selectedLessonId,
  );

  if (selectedLessonId && selectedLessonExists) {
    return selectedLessonId;
  }

  return getTodaysLesson(completedLessonIds)?.id ?? null;
}

// hasValidSelectedLesson は、テーマ一覧で選んだテーマIDが有効かを確認します。
function hasValidSelectedLesson() {
  const selectedLessonId = window.localStorage.getItem(selectedLessonIdStorageKey);

  return lessons.some((lesson) => lesson.id === selectedLessonId);
}

// requestGeminiReply は、ブラウザから自分のAPI Routeへメッセージを送ります。
// Gemini APIキーは /api/chat 側だけで使うため、ブラウザには出ません。
async function requestGeminiReply({
  teacher,
  lessonTitle,
  userMessage,
  messages,
}: {
  teacher: TeacherProfile;
  lessonTitle: string;
  userMessage: string;
  messages: ChatMessage[];
}) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      teacher,
      lessonTitle,
      userMessage,
      messages,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? "Gemini API request failed.");
  }

  return data.reply as string;
}

// requestLearningSummary は、学習完了時に短いまとめをAPI Routeへ依頼します。
async function requestLearningSummary({
  lessonTitle,
  messages,
}: {
  lessonTitle: string;
  messages: ChatMessage[];
}) {
  const response = await fetch("/api/summary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lessonTitle,
      messages,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? "Gemini summary request failed.");
  }

  return data.summary as string;
}

function loadLearningSummary(lessonId: string) {
  const savedSummaries = window.localStorage.getItem(learningSummaryStorageKey);

  if (!savedSummaries) {
    return "";
  }

  try {
    const summaries = JSON.parse(savedSummaries) as LearningSummaryByLesson;
    return summaries[lessonId] ?? "";
  } catch {
    return "";
  }
}

function saveLearningSummary(lessonId: string, summary: string) {
  const savedSummaries = window.localStorage.getItem(learningSummaryStorageKey);
  let summaries: LearningSummaryByLesson = {};

  try {
    summaries = savedSummaries ? JSON.parse(savedSummaries) : {};
  } catch {
    summaries = {};
  }

  window.localStorage.setItem(
    learningSummaryStorageKey,
    JSON.stringify({
      ...summaries,
      [lessonId]: summary,
    }),
  );
}

// createDummyTeacherReply は、Gemini API接続前の仮返答を作る関数です。
// 先生プロフィールの内容を文章に含めることで、設定が反映されていることを確認できます。
function createDummyTeacherReply(
  teacher: TeacherProfile,
  userText: string,
  lessonTitle?: string,
) {
  const lessonExplanation = getLessonExplanation(lessonTitle);

  return `${teacher.name}です。今の質問は「${userText}」ですね。${teacher.personality}な先生として、${teacher.tone}で答えます。${lessonExplanation}${teacher.teachingStyle}ように、まずはここからゆっくり確認していきましょう。`;
}

// getLessonExplanation は、今日のテーマに合わせたダミー説明を返します。
// Gemini APIに接続するまでは、この部分でテーマ別の返答を作ります。
function getLessonExplanation(lessonTitle?: string) {
  switch (lessonTitle) {
    case "AIとは何か":
      return "AIとは、人間の知的な作業をコンピューターで再現しようとする技術です。まずは「判断や文章作成を手伝う仕組み」と考えると分かりやすいですよ。";
    case "LLMとは何か":
      return "LLMとは、大量の文章を学習して言葉を扱うAIのことです。まずは「次に来る言葉を予測する仕組み」と考えると分かりやすいですよ。";
    case "プロンプトとは何か":
      return "プロンプトとは、AIに出す指示や質問のことです。お願いの仕方を少し変えるだけで、返ってくる答えも変わります。";
    case "株とは何か":
      return "株とは、会社の一部を持つ権利のようなものです。会社を応援しながら、その成長の一部に参加するイメージです。";
    case "PERとは何か":
      return "PERとは、会社の利益に対して株価がどれくらい高いかを見る目安です。ざっくり言うと「利益から見た株価のものさし」です。";
    case "ETFとは何か":
      return "ETFとは、いろいろな株などをまとめて買える投資商品の一つです。1つ買うだけで分散投資しやすいのが特徴です。";
    case "Webとは何か":
      return "Webとは、インターネット上でページやサービスを見たり使ったりする仕組みです。ブラウザで開く画面の多くはWebでできています。";
    case "APIとは何か":
      return "APIとは、アプリ同士が決まった形でやり取りするための窓口です。たとえば天気アプリが天気データを取りに行く入口のようなものです。";
    case "Next.jsとは何か":
      return "Next.jsとは、Reactを使ってWebアプリを作りやすくするための仕組みです。ページ作成や画面遷移を便利にしてくれます。";
    default:
      return "今日のテーマについて、まずは身近な例から少しずつ考えていきましょう。";
  }
}

// createInitialTeacherMessage は、テーマごとの履歴がまだないときの最初の挨拶です。
function createInitialTeacherMessage(teacherName: string): ChatMessage {
  return {
    id: 1,
    role: "teacher",
    message: `${teacherName}です。今日は一緒に、少しずつ学んでいきましょう。`,
    timestamp: new Date().toISOString(),
  };
}

// saveMessagesForLesson は、指定したテーマIDのチャット履歴だけを保存します。
function saveMessagesForLesson(lessonId: string, messages: ChatMessage[]) {
  const savedHistoryByLesson = window.localStorage.getItem(
    chatByLessonStorageKey,
  );
  let historyByLesson: ChatHistoryByLesson = {};

  try {
    historyByLesson = savedHistoryByLesson
      ? JSON.parse(savedHistoryByLesson)
      : {};
  } catch {
    historyByLesson = {};
  }

  const nextHistoryByLesson: ChatHistoryByLesson = {
    ...historyByLesson,
    [lessonId]: messages,
  };

  window.localStorage.setItem(
    chatByLessonStorageKey,
    JSON.stringify(nextHistoryByLesson),
  );
}

// addXp は、現在保存されているXPに指定したXPを足す関数です。
// LocalStorageには文字として保存されるため、Numberで数値に戻してから計算します。
function addXp(amount: number) {
  const savedXp = window.localStorage.getItem(xpStorageKey);
  const currentXp = savedXp ? Number(savedXp) : 0;
  const safeCurrentXp = Number.isFinite(currentXp) ? currentXp : 0;
  const nextXp = safeCurrentXp + amount;

  window.localStorage.setItem(xpStorageKey, String(nextXp));
}

// earnFirstLearningBadge は、初回学習完了バッジを保存します。
// すでに獲得済みの場合は、重複して保存しません。
function earnFirstLearningBadge() {
  const savedBadgeIds = window.localStorage.getItem(earnedBadgeIdsStorageKey);
  let earnedBadgeIds: string[] = [];

  try {
    earnedBadgeIds = savedBadgeIds ? JSON.parse(savedBadgeIds) : [];
  } catch {
    earnedBadgeIds = [];
  }

  if (earnedBadgeIds.includes(firstLearningCompleteBadgeId)) {
    return;
  }

  const nextEarnedBadgeIds = [
    ...earnedBadgeIds,
    firstLearningCompleteBadgeId,
  ];

  window.localStorage.setItem(
    earnedBadgeIdsStorageKey,
    JSON.stringify(nextEarnedBadgeIds),
  );
}

// StreakData は、連続学習日数を保存するための型です。
type StreakData = {
  streakDays: number;
  lastStudiedDate: string;
};

// updateStreak は、今日の学習完了に合わせて連続学習日数を更新します。
function updateStreak() {
  const today = getDateText(new Date());
  const yesterday = getDateText(getYesterday(new Date()));
  const savedStreak = window.localStorage.getItem(streakStorageKey);
  let currentStreak: StreakData = { streakDays: 0, lastStudiedDate: "" };

  try {
    currentStreak = savedStreak ? JSON.parse(savedStreak) : currentStreak;
  } catch {
    currentStreak = { streakDays: 0, lastStudiedDate: "" };
  }

  if (currentStreak.lastStudiedDate === today) {
    return;
  }

  const nextStreakDays =
    currentStreak.lastStudiedDate === yesterday
      ? currentStreak.streakDays + 1
      : 1;

  const nextStreak: StreakData = {
    streakDays: nextStreakDays,
    lastStudiedDate: today,
  };

  window.localStorage.setItem(streakStorageKey, JSON.stringify(nextStreak));
}

// getDateText は、日付を YYYY-MM-DD の形にします。
function getDateText(date: Date) {
  return date.toLocaleDateString("sv-SE");
}

// getYesterday は、指定された日付の前日を返します。
function getYesterday(date: Date) {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}
