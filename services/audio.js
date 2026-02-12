let openai = null;

if (process.env.OPENAI_API_KEY) {
  const OpenAI = require("openai");
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

async function transcrever(path){

  if (!openai) {
    console.log("🎤 áudio desativado — sem OPENAI_API_KEY");
    return null;
  }

  const fs = require("fs");

  const r = await openai.audio.transcriptions.create({
    file: fs.createReadStream(path),
    model: "gpt-4o-mini-transcribe"
  });

  return r.text;
}

module.exports = { transcrever };
