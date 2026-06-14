import { NextResponse } from "next/server";
import type { TeacherProfile } from "../../../lib/teacher";

type ChatMessage = {
  role: "user" | "teacher" | "system";
  message: string;
  timestamp: string;
};

type ChatRequestBody = {
  teacher: TeacherProfile;
  lessonTitle: string;
  userMessage: string;
  messages: ChatMessage[];
};

// POST /api/chat は、学習画面から送られたメッセージをGeminiへ渡します。
// APIキーはサーバー側だけで使うため、ブラウザには見えません。
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[Gemini chat] Missing API key", {
      stage: "read-env",
      name: "MissingGeminiApiKey",
      message: "GEMINI_API_KEY is not set.",
    });

    return NextResponse.json(
      { error: "GEMINI_API_KEY が設定されていません。" },
      { status: 500 },
    );
  }

  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch (error) {
    logGeminiError("parse-request", error);

    return NextResponse.json(
      { error: "リクエストの読み取りに失敗しました。" },
      { status: 400 },
    );
  }

  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const systemPrompt = createSystemPrompt(body.teacher, body.lessonTitle);
    const recentMessages = body.messages
      .filter((message) => message.role !== "system")
      .slice(-8);
    const contents = [
      ...recentMessages.map((message) => ({
        role: message.role === "teacher" ? "model" : "user",
        parts: [{ text: message.message }],
      })),
      {
        role: "user",
        parts: [{ text: body.userMessage }],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      logGeminiError("call-gemini", new Error(errorText), response.status);

      return NextResponse.json(
        { error: "Gemini APIの呼び出しに失敗しました。" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("") ?? "";

    if (!reply) {
      logGeminiError(
        "read-gemini-response",
        new Error("Gemini response did not include reply text."),
      );

      return NextResponse.json(
        { error: "Geminiから返答を取得できませんでした。" },
        { status: 500 },
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    logGeminiError("unexpected", error);

    return NextResponse.json(
      { error: "Gemini APIの処理中にエラーが発生しました。" },
      { status: 500 },
    );
  }
}

function createSystemPrompt(teacher: TeacherProfile, lessonTitle: string) {
  return `
あなたは「知の冒険」という学習アプリのAI先生です。

先生プロフィール:
- 名前: ${teacher.name}
- 一人称: ${teacher.firstPerson}
- 性格: ${teacher.personality}
- 口調: ${teacher.tone}
- 教え方: ${teacher.teachingStyle}
- 励まし方: ${teacher.encouragementStyle}

今日のテーマ:
${lessonTitle}

ルール:
- 初心者向けに、簡単な言葉で説明してください。
- 一度に長く話しすぎないでください。
- 答えを一方的に教えるだけでなく、必要に応じて小さな質問をしてください。
- ユーザーを責めず、穏やかに励ましてください。
- 返答は日本語で書いてください。
`.trim();
}

function logGeminiError(stage: string, error: unknown, httpStatus?: number) {
  const safeError =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
        }
      : {
          name: "UnknownError",
          message: String(error),
        };

  console.error("[Gemini chat] Request failed", {
    stage,
    httpStatus,
    ...safeError,
  });
}
