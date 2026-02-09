import express from "express";

const app = express();
app.use(express.json());

// 🔹 VERIFICAÇÃO DO WEBHOOK (META EXIGE ISSO)
app.get("/webhook", (req, res) => {
  const verify_token = "caixabot123"; // pode ser qualquer texto

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === verify_token) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 🔹 RECEBER MENSAGENS
app.post("/webhook", (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Servidor rodando");
});
