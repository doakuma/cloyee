import Anthropic from "@anthropic-ai/sdk";
import { parseClaudeJson, DEFAULT_MODEL } from "@/lib/claude";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const isDev = process.env.NODE_ENV !== "production";

// 개발/테스트: claude-haiku-4-5 (저비용)
// 프로덕션:    claude-sonnet-4-6 (고품질)

// 스트림 청크 구분자 — 메시지 텍스트와 메타데이터 JSON을 분리
const META_SEP = "<<<CLOYEE_META>>>";

function buildSystemPrompt(category, title, userProfile, roadmap) {
  const profileSection = userProfile
    ? `\n## 학습자 정보\n- 직군: ${userProfile.job_role ?? "미설정"}\n- 경력: ${userProfile.experience ?? "미설정"}\n- 레벨: ${userProfile.level ?? "미설정"}\n이에 맞는 난이도와 톤으로 대화해주세요.\n`
    : "";

  const roadmapContext = roadmap
    ? `\n## 학습 로드맵\n- 주제: ${roadmap.topic}\n- 난이도: ${roadmap.difficulty ?? "미설정"}\n- 학습 기간: ${roadmap.duration ?? "미설정"}\n- 현재 수준: ${roadmap.current_level ?? "미입력"}\n- 목표 수준: ${roadmap.target_level ?? "미입력"}\n이 로드맵 기반으로 학습자 수준에 맞게 소크라테스식 문답을 진행해줘.\n`
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
${roadmapContext}
## 응답 형식
아래 순서를 정확히 지켜 응답하세요:

1. 학습자에게 전달할 메시지를 자유롭게 작성합니다 (질문, 힌트, 피드백 등)
2. 메시지 작성 후 반드시 아래 구분자를 그대로 출력합니다:
<<<CLOYEE_META>>>
3. 구분자 바로 다음 줄에 아래 JSON을 한 줄로 출력합니다 (코드블록 없이):
{"score":점수,"feedback":"피드백","is_complete":true또는false,"summary":"요약"}

## is_complete 판단 기준
- 핵심 개념을 학습자가 자신의 언어로 설명할 수 있을 때
- 주요 예시에 대해 올바른 답변을 3회 이상 연속으로 할 때
- score가 80점 이상이고 학습 흐름이 자연스럽게 마무리될 때

## 객관식 선택지 (선택적 사용)
사용자의 이해를 확인하거나 선택지가 명확한 개념을 물어볼 때만 아래 형식으로 선택지를 제공한다.
모든 응답에 붙이지 말고, 선택지가 2~4개이고 내용이 명확히 구분될 때만 사용한다.

[[CHOICES]]
A. 첫 번째 선택지
B. 두 번째 선택지
[[/CHOICES]]

## 기타
- 한국어로 대화합니다
- 격려와 긍정적인 톤을 유지합니다`;
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  isDev && console.log("[chat] ANTHROPIC_API_KEY 로드 여부:", apiKey ? `설정됨 (sk-...${apiKey.slice(-4)})` : "❌ 없음");

  const supabaseServer = await createSupabaseServerClient();
  const { data: { user } } = await supabaseServer.auth.getUser();

  const { category, title, messages, message, userProfile, roadmap } = await request.json();
  isDev && console.log("[chat] 요청 수신 — category:", category, "| message:", message?.slice(0, 50));

  if (!message?.trim()) {
    return Response.json({ error: "message가 필요합니다." }, { status: 400 });
  }

  const conversationMessages = [
    ...(messages ?? []),
    { role: "user", content: message },
  ];

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      // buffer: 아직 클라이언트에 보내지 않은 누적 텍스트
      let buffer = "";
      let metaFound = false;

      try {
        isDev && console.log("[chat] Claude stream 시작 — 메시지 수:", conversationMessages.length);

        const stream = client.messages.stream({
          model: DEFAULT_MODEL,
          max_tokens: 1024,
          system: buildSystemPrompt(category ?? "일반", title ?? "자유 학습", userProfile ?? null, roadmap ?? null),
          messages: conversationMessages,
        });

        for await (const event of stream) {
          if (event.type !== "content_block_delta" || event.delta.type !== "text_delta") continue;

          buffer += event.delta.text;

          if (metaFound) continue; // 구분자 이후는 JSON 버퍼링만

          const sepIdx = buffer.indexOf(META_SEP);
          if (sepIdx !== -1) {
            // 구분자 발견 — 앞부분 텍스트 flush
            metaFound = true;
            const textPart = buffer.slice(0, sepIdx);
            if (textPart) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(textPart)}\n\n`));
            }
            buffer = buffer.slice(sepIdx + META_SEP.length);
          } else {
            // 구분자 미발견 — 구분자가 청크 경계에 걸릴 수 있으므로 마지막 (SEP_LEN-1) 글자는 보류
            const safeLen = buffer.length - (META_SEP.length - 1);
            if (safeLen > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(buffer.slice(0, safeLen))}\n\n`));
              buffer = buffer.slice(safeLen);
            }
          }
        }

        // 스트림 완료 — 남은 버퍼 처리
        let meta = { score: 0, feedback: "", is_complete: false, summary: "" };

        if (!metaFound) {
          // 구분자 없음 — 전체를 텍스트로 처리 (fallback)
          isDev && console.warn("[chat] META 구분자 없음 — fallback");
          if (buffer) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(buffer)}\n\n`));
          }
        } else {
          // buffer에 JSON 메타데이터가 남아 있음
          const metaStr = buffer.trim();
          if (metaStr) {
            try {
              const parsed = parseClaudeJson(metaStr);
              const rawScore = parsed.score ?? 0;
              meta = {
                score: Math.min(100, Math.max(0, rawScore)),
                feedback: parsed.feedback ?? "",
                is_complete: parsed.is_complete ?? false,
                summary: parsed.summary ?? "",
              };
            } catch (e) {
              isDev && console.error("[chat] META JSON 파싱 실패:", e.message, "| raw:", metaStr.slice(0, 200));
            }
          }
        }

        isDev && console.log("[chat] 스트림 완료 — score:", meta.score, "| is_complete:", meta.is_complete);
        controller.enqueue(encoder.encode(`data: [DONE]${JSON.stringify(meta)}\n\n`));
      } catch (err) {
        console.error("[chat] ❌ Claude stream 오류:", err.message);
        controller.enqueue(encoder.encode(`data: [ERROR]${JSON.stringify({ error: err.message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
