import AWS from "aws-sdk";
import fs from "fs";
import sound from "sound-play";

if (process.env.AWS_REGION) AWS.config.region = process.env.AWS_REGION;
if (process.env.AWS_IDENTITY_POOL_ID)
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: process.env.AWS_IDENTITY_POOL_ID,
  });

const polly = process.env.AWS_IDENTITY_POOL_ID
  ? new AWS.Polly({ apiVersion: "2016-06-10" })
  : null;

export const speak = async (text: string, lang: "ko-KR" | "en-US") => {
  try {
    await new Promise<void>((resolve, reject) => {
      const params = {
        OutputFormat: "mp3",
        Text: `${text}`,
        VoiceId: lang === "ko-KR" ? "Seoyeon" : "Ivy",
      };

      if (!polly) {
        resolve();
        return;
      }

      polly.synthesizeSpeech(params, async (err, data) => {
        if (err) {
          console.log(err, err.stack);
          reject(err);
        } else if (data) {
          if (data.AudioStream) {
            const uInt8Array = new Uint8Array(data.AudioStream as Buffer);
            const arrayBuffer = uInt8Array.buffer;

            // nodejs save to wav
            fs.writeFileSync(`./dist/_.mp3`, Buffer.from(arrayBuffer));
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const absoultePath = fs.realpathSync("./dist/_.mp3");
            await sound.play(absoultePath, 1);
            resolve();
          }
        }
      });
    });
  } catch (e) {}
};
