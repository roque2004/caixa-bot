const express = require("express");

const app = express();
app.use(express.json());

// 🔹 Verificação do webhook
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "caixabot123";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// 🔹 Receber mensagens
app.post("/webhook", (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];

  if (message) {
    const from = message.from;
    const text = message.text?.body;

    console.log("📩 Nova mensagem:", from, text);
  }

  res.sendStatus(200);
});

// Porta do Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Bot rodando na porta", PORT);
});
