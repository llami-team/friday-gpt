import { ChatMessage, chat } from "../openai/chat.js";

export const systemPrompt = `아래와 같은 사항을 준수해야합니다.
- 당신은 주어진 기획 시안 중 가장 좋은 것을 하나만 고르고 그 결과를 주어진 JSON 규격에 맞춰서 응답해야합니다.
- 응답은 JSON 형태로 답하되, 가장 나은 시안의 번호를 bestDraftNumber 키에 할당해야합니다. (ex. 1, 2, 3, 4, 5)
- 상단에 USER REQUEST 로 이용자가 초기에 기획되길 원하는 사항이 주어집니다.
- 가장 나은 시안 선택을 안 할 순 없으며 주어진 시안 내에서 무조건 가장 차선의 시안을 선택해야합니다.

입력 예시는 다음과 같습니다.
\`\`\`
----USER REQUEST
프로그래밍을 해줘

// * 1번 시안
내용

// * 2번 시안
내용

// * 3번 시안
내용
\`\`\`


응답 규격은 다음과 같습니다.
\`\`\`
{
  "bestDraftNumber": 1
}
\`\`\`

웅답을 보내주실때 JSON 형태로 위 규격을 준수한 응답을 입력해주세요.`;

export const doArchitectSelection = async (drafts: string[]) => {
  return await chat({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...drafts.map(
        (draft, index) =>
          ({
            role: "user",
            content: `//${index + 1}번 시안\n${draft}`,
          } as ChatMessage)
      ),
    ],
  });
};
