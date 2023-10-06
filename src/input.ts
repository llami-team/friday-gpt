import { cli } from "cleye";
import { input } from "@inquirer/prompts";
import { logger } from "./utils/logger.js";

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

export { userRequest };

export const countConfig = {
  architect: {
    // * 초기 기획서를 몇 개까지 만들고 고민할지 설정합니다.
    draftCount: 3,
    // * 기획서 보완을 위한 회의를 최대 몇 번까지 진행 할지 설정합니다.
    maxMeetingCount: 10,
  },
};
