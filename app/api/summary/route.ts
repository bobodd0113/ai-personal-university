import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "teacher" | "system";
  message: string;
  timestamp: string;
};

type SummaryRequestBody = {
  lessonTitle: string;
  messages: ChatMessage[];
};

// POST /api/summary は、学習完了時に「今日の学びまとめ」をGeminiへ依頼します。
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[Gemini summary] Missing API key", {
      stage: "read-env",
      name: "MissingGeminiApiKey",
      message: "GEMINI_API_KEY is not set.",
    });

    return NextResponse.json(
      { error: "GEMINI_API_KEY が設定されていません。" },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as SummaryRequestBody;
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const recentMessages = body.messages
      .filter((message) => message.role !== "system")
      .slice(-10)
      .map((message) => `${message.role}: ${message.message}`)
      .join("\n");

    const prompt = `
次の学習内容を、初心者向けに3〜5行の短い箇条書きでまとめてください。
余計な前置きは不要です。

テーマ:
${body.lessonTitle}

会話履歴:
${recentMessages || "会話履歴はまだ少ないです。テーマの基本を短くまとめてください。"}
`.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      logSummaryError("call-gemini", new Error(errorText), response.status);

      return NextResponse.json(
        { error: "Gemini APIの呼び出しに失敗しました。" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const summary =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("") ?? "";

    if (!summary) {
      logSummaryError(
        "read-gemini-response",
        new Error("Gemini response did not include summary text."),
      );

      return NextResponse.json(
        { error: "Geminiからまとめを取得できませんでした。" },
        { status: 500 },
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    logSummaryError("unexpected", error);

    return NextResponse.json(
      { error: "まとめ生成中にエラーが発生しました。" },
      { status: 500 },
    );
  }
}

function logSummaryError(stage: string, error: unknown, httpStatus?: number) {
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

  console.error("[Gemini summary] Request failed", {
    stage,
    httpStatus,
    ...safeError,
  });
}
