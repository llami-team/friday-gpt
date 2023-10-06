import { cli } from "cleye";

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
  userRequest =
    "키워드를 하나 입력받은다음 youtube.com 에서 해당 키워드의 영상 5개를 다운받는 프로그램을 Typescript 로 작성해줘";
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
