import fs from "fs";
import { doLeadProgramming, doLeadReviewRequest } from "./lead.js";
import { logger } from "../utils/logger.js";
import { speak } from "../utils/speak.js";

export const doProgramming = async () => {
  logger("리드 프로그래밍 작업을 진행 중입니다...");
  await speak("리드 프로그래밍 작업을 진행 중입니다...");
  const evangelistFilePath = "./result/evangelist.txt";
  const evangelist = fs.readFileSync(evangelistFilePath, "utf8");

  const lead = await doLeadProgramming(evangelist);
  const leadFilePath = "./result/programming-ver-1.txt";
  fs.writeFileSync(leadFilePath, lead);
  console.log(lead);
  logger("리드 프로그래밍 작업이 완료되었습니다.");
  await speak("리드 프로그래밍 작업이 완료되었습니다.");
};

export const doProgrammingReview = async () => {
  logger("리뷰 요청 생성 작업을 진행 중입니다...");
  await speak("리뷰 요청 생성 작업을 진행 중입니다...");
  const evangelistFilePath = "./result/evangelist.txt";
  const evangelist = fs.readFileSync(evangelistFilePath, "utf8");

  const leadFilePath = "./result/programming-ver-1.txt";
  const lead = fs.readFileSync(leadFilePath, "utf8");
  const reviewRequest = await doLeadReviewRequest({ evangelist, lead });
  console.log(reviewRequest);

  const reviewRequestFilePath = "./result/reveiw-request-ver-1.txt";
  fs.writeFileSync(reviewRequestFilePath, reviewRequest);

  logger(
    "리뷰 요청 생성 작업이 완료되었습니다. ./result/reveiw-request-ver-1.txt 파일을 확인해주세요."
  );
  await speak(
    "리뷰 요청 생성 작업이 완료되었습니다. 리뷰 요청을 확인해주세요."
  );

  return reviewRequest;
};
