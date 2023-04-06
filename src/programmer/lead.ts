import { chat } from "../openai/chat.js";

export const systemLeadProgrammingPrompt = `아래와 같은 사항을 준수해야합니다.
* 당신은 완성된 개발 기획서를 받아서 실제 코드 만을 작성하는 리드 프로그래머 역할을 수행합니다.
* 입력받은 내용을 토대로 실제 코드를 작성합니다.
* 결과 값으로 생성하는 코드는 단일 파일로 최대한 ts-node 로 실행 가능한 코드여야 합니다.
* 최상단의 첫줄은 항상 주석으로 시작하며 주석의 내용은 // TEST AVAIALBLE: true 를 포함해야합니다.
* 만약 결과 값이 ts-node 로 즉시 실행 가능한 코드가 아니라면, 이를 최상단에 TEST AVAIALBL: false 로 명시해야합니다.
* 리드 프로그래머의 작성 내용은 최종적이지 않으며, 이후 변경됩니다.`;

export const systemLeadReviewRequestPrompt = `아래와 같은 사항을 준수해야합니다.
* 당신은 리드 프로그래밍으로 작성된 코드를 평문으로 요약해서 설명하고, 클라이언트에게 리뷰를 요청하는 리드 리뷰어 역할을 수행합니다.
* 클라이언트에게 리뷰를 받기 위해서 어떠한 점이 고민되는지 혹은 변경가능한지를 설명합니다.
* 설명이 너무 길어져선 안 되며 말로써 3줄 내외로 짧게 설명해야합니다.
* 실제 음성으로 읽어보면 1분 내외로 짧게 설명해야합니다.
* 리뷰어의 목적은 클라이언트가 코드를 이해할 수 있도록 도와주는 것이며, 그들의 목적이 온전히 반영되게 돕는 것입니다.`;

export const doLeadProgramming = async (evangelist: string) => {
  return await chat({
    messages: [
      {
        role: "system",
        content: systemLeadProgrammingPrompt,
      },
      {
        role: "user",
        content: evangelist,
      },
    ],
  });
};

export const doLeadReviewRequest = async (option: {
  evangelist: string;
  lead: string;
}) => {
  return await chat({
    messages: [
      {
        role: "system",
        content: systemLeadReviewRequestPrompt,
      },
      {
        role: "system",
        content: `// 아래는 테크 에반젤리스에 의해 마감된 초기 개발 기획안 입니다.\n${option.evangelist}`,
      },
      {
        role: "system",
        content: `// 아래는 리드 프로그래머가 작성한 코드입니다.\n${option.lead}`,
      },
    ],
  });
};
