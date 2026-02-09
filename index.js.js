const express = require("express");
const fetch = require("node-fetch"); // npm install node-fetch@2
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

// 🔹 Receber e responder mensagens
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];

  if (message) {
    const from = message.from; // número do usuário
    const text = message.text?.body;

    console.log("📩 Nova mensagem:", from, text);

    // 🔹 Enviar resposta automática
    const token = process.env.WHATSAPP_TOKEN; // coloque seu token do Meta no Render
    const phone_number_id = process.env.WHATSAPP_PHONE_ID; // id do número do WhatsApp Cloud

    await fetch(`https://graph.facebook.com/v17.0/${phone_number_id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: from,
        text: { body: `Oi! Recebi sua mensagem: "${text}"` },
      }),
    });
  }

  res.sendStatus(200);
});

// Porta do Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Bot rodando na porta", PORT);
});
