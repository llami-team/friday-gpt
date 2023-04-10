import sdk from "microsoft-cognitiveservices-speech-sdk";
import fs from "fs";
import sound from "sound-play";

export const speak = async (text: string) => {
  try {
    await new Promise<void>((resolve, reject) => {
      const audioFile = "./dist/_.wav";
      // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY,
        process.env.AZURE_SPEECH_REGION
      );
      const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

      // The language of the voice that speaks.
      speechConfig.speechSynthesisVoiceName = process.env.AZURE_SPEECH_VOICE;

      // Create the speech synthesizer.
      var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

      synthesizer.speakTextAsync(
        text,
        async (result) => {
          synthesizer.close();
          synthesizer = null;

          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            const absoultePath = fs.realpathSync(audioFile);
            await sound.play(absoultePath, 1);
          } else {
            console.error(
              "Speech synthesis canceled, " +
                result.errorDetails +
                "\nDid you set the speech resource key and region values?"
            );
          }
          resolve();
        },
        function (err) {
          console.trace("err - " + err);
          synthesizer.close();
          synthesizer = null;
          resolve();
        }
      );
    });
  } catch (e) {}
};
