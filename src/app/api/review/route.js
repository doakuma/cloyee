import Anthropic from "@anthropic-ai/sdk";
import { parseClaudeJson, DEFAULT_MODEL } from "@/lib/claude";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const isDev = process.env.NODE_ENV !== "production";

// 개발/테스트: claude-haiku-4-5-20251001 (저비용)
// 프로덕션:    claude-sonnet-4-6 (고품질)
function buildSystemPrompt(category, title, code, language, userProfile) {
  const profileSection = userProfile
    ? `\n## 개발자 정보\n- 직군: ${userProfile.job_role ?? "미설정"}\n- 경력: ${userProfile.experience ?? "미설정"}\n- 레벨: ${userProfile.level ?? "미설정"}\n이에 맞는 수준으로 리뷰를 진행해주세요.\n`
    : "";

  return `당신은 시니어 개발자이자 코드 리뷰 전문가 Cloyee입니다.
대화형으로 코드 리뷰를 진행하며, 개발자가 스스로 코드를 개선할 수 있도록 이끌어줍니다.
${profileSection}
## 리뷰 대상
- 카테고리: ${category}
- 주제: ${title}
- 언어: ${language}

## 리뷰할 코드
\`\`\`${language}
${code}
\`\`\`

## 리뷰 방식
- 첫 응답: 전반적인 코드 품질 평가와 좋은 점 먼저 언급
- 이후: 개선 사항을 하나씩 구체적으로 대화형으로 제시
- 개선 이유와 방법을 친절하게 설명하고, 개선된 코드 예시 제공
- 개발자의 질문에 적극적으로 답변

## 완료 기준
- 주요 개선 사항을 모두 다루었을 때
- 개발자가 충분히 이해했다고 판단될 때

## 응답 규칙
반드시 아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

\`\`\`json
{
  "message": "리뷰 메시지 (마크다운 사용 가능, 코드 예시 포함 가능)",
  "score": 0~100 사이 정수 (코드 품질 점수),
  "feedback": "이번 응답의 핵심을 한 줄로 요약",
  "is_complete": true 또는 false,
  "summary": "is_complete가 true일 때만 작성. 전체 리뷰 요약 및 개선 포인트 정리. false면 빈 문자열"
}
\`\`\`

## 기타
- 한국어로 대화합니다
- 비판보다 건설적인 피드백을 제공합니다`;
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  isDev && console.log("[review] ANTHROPIC_API_KEY 로드 여부:", apiKey ? `설정됨 (sk-...${apiKey.slice(-4)})` : "❌ 없음");

  const supabaseServer = await createSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const userId = user?.id ?? null;

  const { category, title, code, language, messages, message, userProfile } = await request.json();

  if (!message?.trim()) {
    return Response.json({ error: "message가 필요합니다." }, { status: 400 });
  }
  if (!code?.trim()) {
    return Response.json({ error: "code가 필요합니다." }, { status: 400 });
  }

  const conversationMessages = [
    ...(messages ?? []),
    { role: "user", content: message },
  ];

  let raw;
  try {
    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      system: buildSystemPrompt(category ?? "일반", title ?? "코드 리뷰", code, language ?? "plaintext", userProfile ?? null),
      messages: conversationMessages,
    });
    raw = response.content[0].text;
    isDev && console.log("[review] Claude 응답 수신 — 길이:", raw.length);
  } catch (err) {
    console.error("[review] ❌ Claude API 오류");
    console.error("  name   :", err.name);
    console.error("  message:", err.message);
    console.error("  status :", err.status);
    console.error("  body   :", JSON.stringify(err.error ?? err.body ?? null, null, 2));
    return Response.json({ error: "Claude API 호출에 실패했습니다.", detail: err.message }, { status: 502 });
  }

  let parsed;
  try {
    parsed = parseClaudeJson(raw);
  } catch (err) {
    console.error("[review] JSON 파싱 실패 — fallback 적용:", err.message);
    return Response.json({
      message: "응답을 처리하는 중 문제가 발생했습니다. 다시 시도해주세요.",
      score: 0,
      feedback: "",
      is_complete: false,
      summary: "",
    });
  }

  const rawScore = parsed.score ?? 0;
  return Response.json({
    message: parsed.message ?? "",
    score: Math.min(100, Math.max(0, rawScore)),
    feedback: parsed.feedback ?? "",
    is_complete: parsed.is_complete ?? false,
    summary: parsed.summary ?? "",
    user_id: userId,
  });
}
