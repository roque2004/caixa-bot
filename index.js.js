const express = require("express");

const app = express();

// 🔹 Verificação do webhook (Meta)
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "caixabot123";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Webhook verification:", mode, token, challenge);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Middleware depois do GET
app.use(express.json());

// Porta correta para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta", PORT);
});
