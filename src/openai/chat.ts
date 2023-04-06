import axios from "axios";
import { logger } from "../utils/logger.js";

export const openai = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
});

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export const chat = async (option: {
  messages: ChatMessage[];
  nested?: number;
}) => {
  const { messages, nested } = option;

  if (nested) {
    logger(`현재 ${nested}번째 ChatGPT 로 이어지는 호출 중 입니다.`);
    if (nested > 10) {
      logger("debug", { messages });
      throw new Error("ChatGPT 호출이 너무 많습니다.");
    }
  }
  const { data } = await openai.post("/chat/completions", {
    model: "gpt-3.5-turbo",
    messages,
  });

  const answer = `${data.choices?.[0].message?.content ?? ""}`;
  const finishReason = data.choices?.[0].finish_reason as string;

  if (finishReason === "length") {
    const addedChat = await chat({
      messages: [...messages, { role: "assistant", content: answer }],
      nested: nested ? nested + 1 : 1,
    });
    return answer + addedChat;
  }

  return answer;
};
