require("dotenv").config();
const express = require("express");

const {
  salvarCaixa,
  salvarGasto,
  salvarFechamentoCompleto
} = require("./services/sheets");

const { enviarMensagem } = require("./services/whatsapp");
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
    const from = message.from;

    console.log("📩", texto);

    // 🧾 FECHAMENTO
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

      const diffCaixa = caixaReal - caixaEsperado;
      const diffMaq = maqReal - maqEsperada;

      await salvarFechamentoCompleto({
        total, caixaInicial, dinheiro, debito, credito,
        pix, ifood, sangria,
        caixaEsperado, caixaReal, diffCaixa,
        maqEsperada, maqReal, diffMaq
      });

      await enviarMensagem(from,
`🧾 Fechamento salvo
💰 Caixa esperado: ${caixaEsperado}
💵 Caixa real: ${caixaReal}
📟 Maquininha esperada: ${maqEsperada}
🏧 Maquininha real: ${maqReal}`);

      return res.sendStatus(200);
    }

    // 💸 SAÍDA
    if (
      msg.includes("paguei") ||
      msg.includes("gastei") ||
      msg.includes("comprei") ||
      msg.includes("dei ")
    ) {
      const num = msg.match(/\d+/);
      if (!num) return res.sendStatus(200);

      const valor = parseFloat(num[0]);

      let cat="outros", sub="geral";

      if (msg.includes("padeiro")) {cat="fornecedor";sub="padeiro";}
      if (msg.includes("entregador")) {cat="mão de obra";sub="entregador";}
      if (msg.includes("auxiliar")) {cat="mão de obra";sub="auxiliar";}

      await salvarCaixa("SAIDA", valor, "DINHEIRO", texto);
      await salvarGasto(cat, sub, valor, "DINHEIRO", texto);

      await enviarMensagem(from,
`💸 Saída registrada
R$ ${valor}
${cat} / ${sub}`);

      return res.sendStatus(200);
    }

    // 💰 ENTRADA
    if (msg.startsWith("entrada")) {

      const p = msg.split(" ");
      const valor = parseFloat(p[1]);

      await salvarCaixa("ENTRADA", valor, p[2].toUpperCase(), p.slice(3).join(" "));

      await enviarMensagem(from,
`✅ Entrada registrada
R$ ${valor}`);

      return res.sendStatus(200);
    }

    await processMessage(texto);

  } catch (err) {
    console.error("🔥", err.message);
  }

  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000);
