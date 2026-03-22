import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODEL } from "@/lib/claude";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  const { messages } = await req.json();

  if (!messages?.length) {
    return Response.json({ error: "messages가 필요합니다." }, { status: 400 });
  }

  const filtered = messages
    .map(({ role, content }) => ({ role, content }))
    .slice(-10);

  try {
    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 256,
      system: "당신은 학습 대화를 요약하는 AI입니다. 반드시 한국어로만 답변하세요.",
      messages: [
        ...filtered,
        {
          role: "user",
          content: "지금까지 나눈 대화를 2~3문장으로 간결하게 요약해줘. 어떤 주제를 다뤘고 어떤 점을 학습했는지 중심으로 작성해. 요약 외 다른 말은 하지 마.",
        },
      ],
    });

    const summary = response.content[0].text.trim();
    return Response.json({ summary });
  } catch (err) {
    console.error("[summarize] Claude API 오류:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
