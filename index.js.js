require("dotenv").config();
const express = require("express");

const {
  salvarCaixa,
  salvarGasto,
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
    // 🧾 FECHAMENTO AUTO
    // =====================
    if (msg.includes("vendi") && msg.includes("pix")) {

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
        diffCaixa: caixaReal - caixaEsperado,
        maqEsperada,
        maqReal,
        diffMaq: maqReal - maqEsperada
      });

      console.log("🧾 Fechamento salvo");
      return res.sendStatus(200);
    }

    // =====================
    // 💸 SAÍDA INTELIGENTE
    // =====================
    if (
      msg.includes("paguei") ||
      msg.includes("gastei") ||
      msg.includes("comprei") ||
      msg.includes("dei ")
    ) {

      const num = msg.match(/\d+/);
      if (!num) return res.sendStatus(200);

      const valor = parseFloat(num[0]);

      let cat = "outros";
      let sub = "geral";

      if (msg.includes("padeiro")) { cat="fornecedor"; sub="padeiro"; }
      if (msg.includes("entregador")) { cat="mão de obra"; sub="entregador"; }
      if (msg.includes("auxiliar")) { cat="mão de obra"; sub="auxiliar"; }

      await salvarCaixa("SAIDA", valor, "DINHEIRO", texto);
      await salvarGasto(cat, sub, valor, "DINHEIRO", texto);

      console.log("💸 Saída registrada em caixa + gastos");
      return res.sendStatus(200);
    }

    // =====================
    // 💰 ENTRADA
    // =====================
    if (msg.startsWith("entrada")) {

      const p = msg.split(" ");
      if (p.length >= 3) {
        await salvarCaixa(
          "ENTRADA",
          parseFloat(p[1]),
          p[2].toUpperCase(),
          p.slice(3).join(" ")
        );
      }

      return res.sendStatus(200);
    }

    await processMessage(texto);

  } catch (err) {
    console.error("🔥", err.message);
  }

  res.sendStatus(200);
});


app.listen(process.env.PORT || 3000, () =>
  console.log("🚀 Rodando")
);
