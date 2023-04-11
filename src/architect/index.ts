import { userRequest } from "../input.js";
import { logger } from "../utils/logger.js";
import { findIsGoodToGo, findWhatIdo } from "../utils/match.js";
import { speak } from "../utils/speak.js";
import { doArchitectAntithese } from "./antithese.js";
import { doArchitectSynthese } from "./synthese.js";
import { doArchitectThese } from "./these.js";
import fs from "node:fs";

export const doArchitect = async () => {
  logger("요청사항에 따른 개발 기획을 진행 중 입니다...");
  speak("요청사항에 따른 개발 기획을 진행 중 입니다...");
  let reviewCount = 1;

  const preDialect = await doDialecticSynthese(userRequest, (these) => {
    fs.writeFileSync(`./result/architect-ver-${reviewCount++}.txt`, these);
  });

  let isGoodToGo = preDialect.isGoodToGo;
  let synthese = preDialect.synthese;
  while (true) {
    const dialect = await doDialectic({
      isGoodToGo,
      synthese,
      reviewCount,
      userRequest,
    });

    isGoodToGo = dialect.isGoodToGo;
    synthese = `${dialect.synthese}`;
    reviewCount += 1;
    if (isGoodToGo) {
      logger(
        `개발 기획이 완료되었습니다. (${reviewCount} 번째 검토 만에 완료)`
      );
      speak(
        `개발 기획이 완료되었습니다. ${reviewCount} 번째 검토 만에 완료되었습니다.`
      );
      fs.writeFileSync(`./result/architect-ver-${reviewCount}.txt`, synthese);
      return synthese;
    }
  }
};

export const doDialectic = async ({
  isGoodToGo,
  synthese: these,
  reviewCount,
  userRequest,
}: {
  isGoodToGo: boolean;
  synthese: string;
  reviewCount?: number;
  userRequest?: string;
}) => {
  if (isGoodToGo) {
    return { isGoodToGo, synthese: these };
  } else {
    logger(
      `개발 기획을 추가로 보완하고 있습니다... (${reviewCount} 번째 검토)`
    );
    speak(`개발 기획을 추가로 보완하고 있습니다... (${reviewCount} 번째 검토)`);
    fs.writeFileSync(`./result/architect-ver-${reviewCount}.txt`, these);
    const antithese = await doArchitectAntithese(these);
    console.log(antithese);

    const whatAntitheseDo = findWhatIdo(antithese);

    if (whatAntitheseDo) {
      logger(whatAntitheseDo);
      speak(whatAntitheseDo);
    } else {
      logger("개발 기획을 보완하는 중입니다...");
    }

    // * Synthese 구하기
    const synthese = await doArchitectSynthese(`${these}\n${antithese}`);
    console.log(synthese);

    const whatSyntheseDo = findWhatIdo(synthese);
    if (whatSyntheseDo) {
      logger(whatSyntheseDo);
      speak(whatSyntheseDo);
    } else {
      logger("개발 기획을 검토하는 중입니다...");
    }

    const isGoodToGo = findIsGoodToGo(synthese);
    return {
      isGoodToGo,
      synthese: `----USER REQUEST\n${userRequest}\n${synthese}`,
    };
  }
};

export const doDialecticSynthese = async (
  userRequest: string,
  onThese: (these: string) => unknown
) => {
  // * These 구하기
  const these = await doArchitectThese(userRequest);
  console.log(these);
  onThese(these);
  const whatTheseDo = findWhatIdo(these);
  if (whatTheseDo) {
    logger(whatTheseDo);
    speak(whatTheseDo);
  } else {
    logger("개발 기획을 세우는 중입니다...");
  }

  // * Antithese 구하기
  const antithese = await doArchitectAntithese(
    `----USER REQUEST\n${userRequest}\n${these}`
  );
  console.log(antithese);

  const whatAntitheseDo = findWhatIdo(antithese);

  if (whatAntitheseDo) {
    logger(whatAntitheseDo);
    speak(whatAntitheseDo);
  } else {
    logger("개발 기획을 보완하는 중입니다...");
  }

  // * Synthese 구하기
  const synthese = await doArchitectSynthese(`${these}\n${antithese}`);
  console.log(synthese);

  const whatSyntheseDo = findWhatIdo(synthese);
  if (whatSyntheseDo) {
    logger(whatSyntheseDo);
    speak(whatSyntheseDo);
  } else {
    logger("개발 기획을 검토하는 중입니다...");
  }

  const isGoodToGo = findIsGoodToGo(synthese);
  return {
    isGoodToGo,
    synthese: `----USER REQUEST\n${userRequest}\n${synthese}`,
  };
};
