require("dotenv").config();
const express = require("express");
const { salvarCaixa } = require("./services/sheets");
const { processMessage } = require("./logic/fechamento");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "caixabot123";


// ✅ VERIFICAÇÃO WEBHOOK META
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});


// ✅ RECEBER MENSAGENS
app.post("/webhook", async (req, res) => {

  console.log("📦 PAYLOAD:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message || !message.text) {
      return res.sendStatus(200);
    }

    const texto = message.text.body;
    const mensagem = texto.toLowerCase();

    console.log("📩 Texto:", texto);

    // 🔥 COMANDO ENTRADA / SAÍDA
    if (mensagem.startsWith("entrada") || mensagem.startsWith("saida")) {

      const partes = mensagem.split(" ");

      if (partes.length < 4) {
        console.log("❌ Formato inválido");
        return res.sendStatus(200);
      }

      const tipo = partes[0].toUpperCase();
      const valor = parseFloat(partes[1]);
      const forma = partes[2].toUpperCase();
      const obs = partes.slice(3).join(" ");

      if (isNaN(valor)) {
        console.log("❌ Valor inválido");
        return res.sendStatus(200);
      }

      await salvarCaixa(tipo, valor, forma, obs);

      console.log("✅ SALVO:", tipo, valor, forma, obs);

      return res.sendStatus(200);
    }

    // fallback
    await processMessage(texto);

  } catch (err) {
    console.error("🔥 ERRO:", err.message);
  }

  res.sendStatus(200);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Rodando na porta", PORT);
});
