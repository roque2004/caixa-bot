require("dotenv").config();
const express = require("express");
const { processMessage } = require("./logic/fechamento");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "caixabot123";

/* 🔹 Verificação do webhook */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/* 🔹 Receber mensagens */
app.post("/webhook", async (req, res) => {
  console.log("📦 PAYLOAD RECEBIDO:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message && message.text) {
      const texto = message.text.body;
      await processMessage(texto);
    }
  } catch (err) {
    console.error("Erro ao processar mensagem:", err.message);
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Bot rodando na porta", PORT);
});
