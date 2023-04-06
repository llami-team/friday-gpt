import { doArchitect } from "./architect/index.js";
import { doTechEvangelist } from "./evangelist/index.js";
import { userRequest } from "./input.js";
import { doProgramming, doProgrammingReview } from "./programmer/index.js";
import { logger } from "./utils/logger.js";
import fs from "node:fs";

const dev = async () => {
  // result 폴더가 없으면 생성
  if (!fs.existsSync("./result")) fs.mkdirSync("./result");

  logger("Friday 인공지능 작동을 시작합니다...\n");
  logger(`요청사항: ${userRequest}`);

  await doArchitect();
  await doTechEvangelist();
  await doProgramming();
  await doProgrammingReview();
};

dev();
