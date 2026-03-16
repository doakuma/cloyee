/**
 * AI 응답 텍스트에서 [[CHOICES]]...[[/CHOICES]] 블록을 파싱합니다.
 * @param {string} text
 * @returns {{ cleanText: string, choices: string[] }}
 */
export function parseChoices(text) {
  const match = text.match(/\[\[CHOICES\]\]([\s\S]*?)\[\[\/CHOICES\]\]/);
  if (!match) return { cleanText: text, choices: [] };

  const block = match[1];
  const choices = block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[A-D]\./.test(line));

  const cleanText = text
    .replace(/\[\[CHOICES\]\][\s\S]*?\[\[\/CHOICES\]\]/, "")
    .trim();

  return { cleanText, choices };
}
