import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
