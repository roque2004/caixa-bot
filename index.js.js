require("dotenv").config();
const express = require("express");

const {
  salvarCaixa,
  salvarFechamentoCompleto
} = require("./services/sheets");

const { processMessage } = require("./logic/fechamento");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "caixabot123";


app.get("/webhook", (req, res) => {
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === VERIFY_TOKEN
  ) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});


app.post("/webhook", async (req, res) => {

  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message || !message.text) {
      return res.sendStatus(200);
    }

    const texto = message.text.body;
    const msg = texto.toLowerCase();

    console.log("📩", texto);

    // =====================
    // ENTRADA / SAIDA
    // =====================
    if (msg.startsWith("entrada") || msg.startsWith("saida")) {

      const p = msg.split(" ");
      if (p.length < 4) return res.sendStatus(200);

      const tipo = p[0].toUpperCase();
      const valor = parseFloat(p[1]);
      const forma = p[2].toUpperCase();
      const obs = p.slice(3).join(" ");

      if (isNaN(valor)) return res.sendStatus(200);

      await salvarCaixa(tipo, valor, forma, obs);

      console.log("✅ Caixa salvo");
      return res.sendStatus(200);
    }

    // =====================
    // FECHAMENTO COMPLETO
    // =====================
    if (msg.startsWith("fechamento")) {

      const pegar = (campo) => {
        const r = new RegExp(campo + "\\s+(\\d+)", "i").exec(texto);
        return r ? parseFloat(r[1]) : 0;
      };

      const total = pegar("vendi");
      const caixaInicial = pegar("caixa inicial");
      const dinheiro = pegar("dinheiro");
      const debito = pegar("debito");
      const credito = pegar("credito");
      const pix = pegar("pix");
      const ifood = pegar("ifood");
      const sangria = pegar("sangria");
      const caixaReal = pegar("caixa real");
      const maqReal = pegar("maquininha real");

      const caixaEsperado = caixaInicial + dinheiro - sangria;
      const maqEsperada = debito + credito + pix;

      const diffCaixa = caixaReal - caixaEsperado;
      const diffMaq = maqReal - maqEsperada;

      await salvarFechamentoCompleto({
        total,
        caixaInicial,
        dinheiro,
        debito,
        credito,
        pix,
        ifood,
        sangria,
        caixaEsperado,
        caixaReal,
        diffCaixa,
        maqEsperada,
        maqReal,
        diffMaq
      });

      console.log("🧾 Fechamento salvo");
      return res.sendStatus(200);
    }

    await processMessage(texto);

  } catch (err) {
    console.error("🔥", err.message);
  }

  res.sendStatus(200);
});


app.listen(process.env.PORT || 3000, () =>
  console.log("🚀 Servidor rodando")
);
