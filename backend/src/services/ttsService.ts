import { 
  PollyClient, 
  SynthesizeSpeechCommand,
  VoiceId,
  LanguageCode,
  Engine
} from "@aws-sdk/client-polly";
import { Readable } from "stream";

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || "us-east-1",
});

interface TTSRequest {
  text: string;
  language: "mr" | "hi" | "en";
}

// Voice mapping for each language
// Note: Using standard engine as Aditi neural doesn't support hi-IN
const VOICE_MAP: Record<string, VoiceId> = {
  mr: VoiceId.Aditi, // Indian voice, works for Marathi
  hi: VoiceId.Aditi, // Indian voice for Hindi
  en: VoiceId.Aditi, // Indian English voice
};

// Language code mapping for Polly
const LANGUAGE_CODE_MAP: Record<string, LanguageCode> = {
  mr: LanguageCode.hi_IN, // Use Hindi for Marathi (closest available)
  hi: LanguageCode.hi_IN,
  en: LanguageCode.en_IN,
};

// Engine mapping - Aditi supports standard engine for hi-IN
const ENGINE_MAP: Record<string, Engine> = {
  mr: Engine.STANDARD,
  hi: Engine.STANDARD,
  en: Engine.STANDARD,
};

export async function synthesizeSpeech(
  request: TTSRequest
): Promise<Buffer> {
  const { text, language } = request;

  const voiceId = VOICE_MAP[language] || VoiceId.Aditi;
  const languageCode = LANGUAGE_CODE_MAP[language] || LanguageCode.en_IN;
  const engine = ENGINE_MAP[language] || Engine.STANDARD;

  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: "mp3",
    VoiceId: voiceId,
    LanguageCode: languageCode,
    Engine: engine,
  });

  try {
    const response = await pollyClient.send(command);

    if (!response.AudioStream) {
      throw new Error("No audio stream received from Polly");
    }

    // Convert the audio stream to a buffer
    const audioStream = response.AudioStream as Readable;
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      audioStream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      audioStream.on("error", reject);
      audioStream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  } catch (error) {
    console.error("Error synthesizing speech with Polly:", error);
    throw error;
  }
}
