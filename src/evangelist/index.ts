import { userRequest } from "../input.js";
import { logger } from "../utils/logger.js";
import { doTechEvangelistWork } from "./work.js";
import fs from "fs";

export const doTechEvangelist = async () => {
  logger("테크 에반젤리스트에 의한 기획서 보충이 진행 중입니다...");

  const resultFolderPath = "./result";
  const resultFiles = await fs.promises.readdir(resultFolderPath);

  let architectHighestVersion = 0;
  for (const resultFile of resultFiles) {
    if (!resultFile.startsWith("architect-ver-")) continue;
    const version = Number(resultFile.split("architect-ver-")[1].split(".")[0]);
    if (version > architectHighestVersion) {
      architectHighestVersion = version;
    }
  }

  const architectResultFilePath = `${resultFolderPath}/architect-ver-${architectHighestVersion}.txt`;
  const architect = await fs.promises.readFile(architectResultFilePath, {
    encoding: "utf-8",
  });

  const evangelist = await doTechEvangelistWork(architect);
  console.log(evangelist);
  await fs.promises.writeFile(
    `${resultFolderPath}/evangelist.txt`,
    `----USER REQUEST\n${userRequest}\n${evangelist}`
  );
  logger("테크 에반젤리스트에 의한 기획서 보충이 완료되었습니다.");
};
