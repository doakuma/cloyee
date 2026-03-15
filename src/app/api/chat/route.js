import Anthropic from "@anthropic-ai/sdk";
import { parseClaudeJson, DEFAULT_MODEL } from "@/lib/claude";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const isDev = process.env.NODE_ENV !== "production";

function buildSystemPrompt(category, title, userProfile) {
  const profileSection = userProfile
    ? `\n## 학습자 정보\n- 직군: ${userProfile.job_role ?? "미설정"}\n- 경력: ${userProfile.experience ?? "미설정"}\n- 레벨: ${userProfile.level ?? "미설정"}\n이에 맞는 난이도와 톤으로 대화해주세요.\n`
    : "";

  return `당신은 소크라테스식 문답법으로 학습을 도와주는 AI 스터디메이트 Cloyee입니다.

## 역할
- 학습자 스스로 답을 찾도록 질문을 통해 이끌어줍니다
- 정답을 직접 알려주기보다 힌트와 반문으로 사고를 자극합니다
- 학습자의 이해도를 지속적으로 평가하고 격려합니다
${profileSection}
## 현재 학습 세션
- 카테고리: ${category}
- 주제: ${title}

## 응답 규칙
반드시 아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

\`\`\`json
{
  "message": "학습자에게 전달할 메시지 (질문, 힌트, 피드백 등)",
  "score": 0~100 사이 정수 (현재까지의 이해도 점수),
  "feedback": "이번 답변에 대한 짧은 피드백 (잘한 점 또는 보완할 점)",
  "is_complete": true 또는 false (학습 목표를 충분히 달성했다고 판단될 때 true),
  "summary": "is_complete가 true일 때만 작성. 오늘 학습한 내용 요약. false면 빈 문자열"
}
\`\`\`

## is_complete 판단 기준
- 핵심 개념을 학습자가 자신의 언어로 설명할 수 있을 때
- 주요 예시에 대해 올바른 답변을 3회 이상 연속으로 할 때
- score가 80점 이상이고 학습 흐름이 자연스럽게 마무리될 때

## 기타
- 한국어로 대화합니다
- 격려와 긍정적인 톤을 유지합니다`;
}

export async function POST(request) {
  // API 키 로드 확인
  const apiKey = process.env.ANTHROPIC_API_KEY;
  isDev && console.log("[chat] ANTHROPIC_API_KEY 로드 여부:", apiKey ? `설정됨 (sk-...${apiKey.slice(-4)})` : "❌ 없음");

  const supabaseServer = await createSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const userId = user?.id ?? null;

  const { category, title, messages, message, userProfile } = await request.json();
  isDev && console.log("[chat] 요청 수신 — category:", category, "| title:", title, "| message:", message?.slice(0, 50));

  if (!message?.trim()) {
    return Response.json({ error: "message가 필요합니다." }, { status: 400 });
  }

  const conversationMessages = [
    ...(messages ?? []),
    { role: "user", content: message },
  ];

  let raw;
  try {
    isDev && console.log("[chat] Claude API 호출 시작 — 메시지 수:", conversationMessages.length);
    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(category ?? "일반", title ?? "자유 학습", userProfile ?? null),
      messages: conversationMessages,
    });
    raw = response.content[0].text;
    isDev && console.log("[chat] Claude 응답 수신 — 길이:", raw.length, "| 앞부분:", raw.slice(0, 100));
  } catch (err) {
    console.error("[chat] ❌ Claude API 오류");
    console.error("  name   :", err.name);
    console.error("  message:", err.message);
    console.error("  status :", err.status);
    console.error("  headers:", err.headers);
    console.error("  body   :", JSON.stringify(err.error ?? err.body ?? null, null, 2));
    return Response.json({ error: "Claude API 호출에 실패했습니다.", detail: err.message }, { status: 502 });
  }

  let parsed;
  try {
    parsed = parseClaudeJson(raw);
  } catch (err) {
    console.error("[chat] JSON 파싱 실패 — fallback 적용:", err.message);
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
