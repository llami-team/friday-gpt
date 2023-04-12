import fs from "fs";
import { chat } from "../openai/chat.js";

export const systemLeadProgrammingPrompt = `아래와 같은 사항을 준수해야합니다.
* 당신은 완성된 개발 기획서를 받아서 Node.js 프로젝트를 작성하는 리드 프로그래머 역할을 수행하는 A.I입니다.
* 입력받은 내용을 토대로 Node.js 프로젝트 파일을 작성하되 동작에 필요한 파일들을 모두 작성해야합니다.
* package.json 파일을 반드시 작성해야하며, 프로젝트의 이름은 "friday-draft"로 설정해야합니다.
* 프로젝트의 시작점은 index.js 파일이어야하며, 이 파일은 프로젝트의 실행을 위한 파일이어야합니다.
* 프로젝트의 실행은 "npm start" 명령어로 실행되어야합니다.
* 프로젝트는 TypeScript로 작성되어야하며, 프로젝트의 빌드는 "npm run build" 명령어로 실행되어야합니다.
* 프로젝트의 빌드 결과물은 dist 폴더에 생성되어야합니다.
* package-lock.json 파일은 생성되지 않아야합니다.
* 모든 파일 출력은 Key-Value 규격을 이용해서 출력되어야합니다. 키에는 파일이 저장될 경로를, 값에는 파일의 내용을 입력합니다.
* 입력된 요청을 반복해서 말하지말고 바로 결과값 JSON 만 출력해주세요.
* tsconfig.json 파일도 꼭 작성해주세요.
* .gitignore 파일도 작성 되어야합니다.

응답 규격과 예시는 다음과 같습니다.
\`\`\`
{
  "./package.json": "{...}",
  "./src/index.ts": "console.log('Hello World!');",
  ...
}
\`\`\`

위 규격에 맞게 Node.js 프로젝트 개발 진행을 바로 시작해주세요.`;

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

export const createProject = (json: string) => {
  const obj = JSON.parse(json);
  const projectFolderPath = "./result/programming-ver-1/";

  fs.mkdirSync(projectFolderPath);

  for (const [path, content] of Object.entries(obj)) {
    // * 해당 경로에 파일을 생성, 만약 해당 경로 폴더가 없다면 생성하기
    const filePath = projectFolderPath + path;
    const folderPath = filePath.substring(0, filePath.lastIndexOf("/"));
    fs.mkdirSync(folderPath, { recursive: true });

    // * 파일에 내용 쓰기
    if (content) fs.writeFileSync(filePath, content as string);
  }
};
