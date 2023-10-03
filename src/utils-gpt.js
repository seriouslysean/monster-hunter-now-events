import OpenAI from "openai";

export const OPENAI_CHAT_ENDPOINT =
  "https://api.openai.com/v1/chat/completions";

export default async function askGPTChat(question) {
  const apiKey = process.env.API_KEY_OPENAI;
  try {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY env required");
    }
    const openai = new OpenAI({ apiKey });
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: question }],
    });
    return chatCompletion.choices?.[0]?.message?.content?.trim() || "INVALID";
  } catch (err) {
    console.error(err);
    return "INVALID";
  }
}
