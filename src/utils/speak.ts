import sdk from "microsoft-cognitiveservices-speech-sdk";
import fs from "fs";
import sound from "sound-play";

export const speak = async (text: string) => {
  try {
    await new Promise<void>((resolve) => {
      const audioFile = "./dist/_.wav";
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY,
        process.env.AZURE_SPEECH_REGION
      );
      const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);
      speechConfig.speechSynthesisVoiceName = process.env.AZURE_SPEECH_VOICE;

      let synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

      synthesizer.speakTextAsync(
        text,
        async (result) => {
          synthesizer.close();
          synthesizer = null;

          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            const absoultePath = fs.realpathSync(audioFile);
            await sound.play(absoultePath, 1);
          } else {
            throw new Error(
              "Speech synthesis canceled, " +
                result.errorDetails +
                "\nDid you set the speech resource key and region values?"
            );
          }
          resolve();
        },
        (err) => {
          console.trace("err - " + err);
          synthesizer.close();
          synthesizer = null;
          resolve();
        }
      );
    });
  } catch (e) {}
};
