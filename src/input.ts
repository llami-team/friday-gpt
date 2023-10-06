import { cli } from "cleye";
import { input, password } from "@inquirer/prompts";
import { logger } from "./utils/logger.js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const argv = cli({
  name: "friday",
  version: "0.0.1",
  flags: {
    prompt: {
      type: String,
      description: "Prompt to run",
      alias: "p",
    },
  },
});

let userRequest = argv._.join(" ");

if (existsSync("./.fridayconfig.json")) {
  const config = JSON.parse(readFileSync("./.fridayconfig.json", "utf-8"));
  if (config.OPENAI_API_KEY) process.env.OPENAI_API_KEY = config.OPENAI_API_KEY;
  if (config.OPENAI_CHAT_MODEL)
    process.env.OPENAI_CHAT_MODEL = config.OPENAI_CHAT_MODEL;

  console.log("loaded!", config);
}

// If OPENAI_API_KEY is empty, ask for it
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.length === 0) {
  logger(`Friday GPT 를 사용하기 위해선 Open A.I API 키를 입력해야합니다.`);
  logger(`키 발급 페이지: https://platform.openai.com/account/api-keys`);

  process.env.OPENAI_API_KEY = await password({
    message: "Open A.I API 키를 입력해주세요:",
  });
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.length === 0) {
    logger("API 키가 입력되지 않았습니다. 프로그램을 종료합니다.");
    process.exit(0);
  }
}

// If OPENAI_CHAT_MODEL is empty, ask for it
if (
  !process.env.OPENAI_CHAT_MODEL ||
  process.env.OPENAI_CHAT_MODEL.length === 0
) {
  process.env.OPENAI_CHAT_MODEL = await input({
    message: "사용하려는 ChatGPT 모델을 입력해주세요:",
    default: "gpt-4",
  });
  if (
    !process.env.OPENAI_CHAT_MODEL ||
    process.env.OPENAI_CHAT_MODEL.length === 0
  ) {
    logger("모델이 입력되지 않았습니다. 프로그램을 종료합니다.");
    process.exit(0);
  }
}

// If userRequest is empty, use the provided default value
if (userRequest === "") {
  userRequest = await input({
    message: "A.I가 수행할 개발 업무 요청을 입력해주세요:",
  });

  if (userRequest === "") {
    logger("요청이 없습니다. 프로그램을 종료합니다.");
    process.exit(0);
  }
}

writeFileSync(
  "./.fridayconfig.json",
  JSON.stringify(
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL,
    },
    null,
    2
  )
);

export { userRequest };

export const countConfig = {
  architect: {
    // * 초기 기획서를 몇 개까지 만들고 고민할지 설정합니다.
    draftCount: 3,
    // * 기획서 보완을 위한 회의를 최대 몇 번까지 진행 할지 설정합니다.
    maxMeetingCount: 10,
  },
};
