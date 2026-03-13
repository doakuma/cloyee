import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Claude 응답 텍스트에서 JSON 객체를 추출합니다.
 * 시도 순서:
 *  1. ```json ... ``` 코드블록
 *  2. ``` ... ``` 코드블록 (언어 미지정)
 *  3. 앞뒤 공백 제거 후 직접 파싱
 *  4. 텍스트 내 첫 번째 { ... } 추출 후 파싱
 *
 * @param {string} raw - Claude 응답 원문
 * @returns {object} 파싱된 JSON 객체
 * @throws {Error} 모든 시도 실패 시
 */
export function parseClaudeJson(raw) {
  // 1. ```json ... ``` 블록
  const jsonBlock = raw.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlock) return JSON.parse(jsonBlock[1].trim());

  // 2. ``` ... ``` 블록 (언어 미지정)
  const codeBlock = raw.match(/```\s*([\s\S]*?)```/);
  if (codeBlock) return JSON.parse(codeBlock[1].trim());

  // 3. 앞뒤 공백 제거 후 직접 파싱
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);

  // 4. 텍스트 내 { } 추출 — 중첩 괄호를 고려해 첫 { 부터 대응하는 } 까지
  const start = raw.indexOf("{");
  if (start !== -1) {
    let depth = 0;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === "{") depth++;
      else if (raw[i] === "}") {
        depth--;
        if (depth === 0) return JSON.parse(raw.slice(start, i + 1));
      }
    }
  }

  throw new Error(`JSON 추출 실패. raw: ${raw.slice(0, 200)}`);
}

const SYSTEM_PROMPT = `당신은 친절한 코딩 학습 도우미입니다.
학습자가 이해하기 쉽도록 단계별로 설명하고, 예시 코드를 적극 활용하세요.
한국어로 대화합니다.`;

export async function createChatCompletion(messages) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages,
  });

  return response.content[0].text;
}

export async function createCodeReview(code) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `다음 코드를 리뷰해주세요. 개선점, 버그, 코드 품질에 대해 구체적으로 피드백해주세요:\n\n\`\`\`\n${code}\n\`\`\``,
      },
    ],
  });

  return response.content[0].text;
}
