require("dotenv").config();
const express = require("express");

const { salvarCaixa, salvarGasto } = require("./services/sheets");
const { enviarMensagem } = require("./services/whatsapp");

const { parse } = require("./logic/nlp");
const {
  salvarPendencia,
  pegarPendencia,
  limparPendencia
} = require("./logic/state");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "caixabot123";

console.log("🧠 CaixaBot V3 iniciado");


// ================= WEBHOOK VERIFY =================

app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});


// ================= WEBHOOK RECEIVE =================

app.post("/webhook", async (req, res) => {
  try {

    const m = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!m?.text) return res.sendStatus(200);

    const texto = m.text.body;
    const from = m.from;

    console.log("📩 MSG:", texto);


    // =================================================
    // 🔁 SE EXISTE PENDÊNCIA DE FORMA DE PAGAMENTO
    // =================================================

    const pend = pegarPendencia(from);

    if (pend) {
      console.log("⏳ Pendência encontrada");

      const tentativa = parse(texto);

      if (tentativa?.forma) {

        const d = pend.dados;

        await salvarCaixa(d.tipo, d.valor, tentativa.forma, d.obs);

        if (d.tipo === "SAIDA") {
          await salvarGasto(
            d.cat,
            d.sub,
            d.valor,
            tentativa.forma,
            d.obs
          );
        }

        limparPendencia(from);

        await enviarMensagem(from,
          `✅ Lançado com ${tentativa.forma}`
        );

        return res.sendStatus(200);
      }
    }


    // =================================================
    // 🧠 PARSER PRINCIPAL
    // =================================================

    const dados = parse(texto);

    if (!dados) {
      console.log("🤷 Não reconhecido");
      return res.sendStatus(200);
    }

    console.log("🧠 Interpretado:", dados);


    // =================================================
    // ❓ SE NÃO TEM FORMA → PERGUNTA
    // =================================================

    if (!dados.forma) {

      salvarPendencia(from, dados);

      await enviarMensagem(from,
        "Qual a forma de pagamento?\n👉 pix, dinheiro, debito ou credito"
      );

      // fallback PIX automático
      setTimeout(async () => {

        const p = pegarPendencia(from);
        if (!p) return;

        const d = p.dados;

        console.log("⏱️ fallback PIX aplicado");

        await salvarCaixa(d.tipo, d.valor, "PIX", d.obs);

        if (d.tipo === "SAIDA") {
          await salvarGasto(d.cat, d.sub, d.valor, "PIX", d.obs);
        }

        limparPendencia(from);

      }, 120000);

      return res.sendStatus(200);
    }


    // =================================================
    // 💾 GRAVA
    // =================================================

    await salvarCaixa(
      dados.tipo,
      dados.valor,
      dados.forma,
      dados.obs
    );

    if (dados.tipo === "SAIDA") {
      await salvarGasto(
        dados.cat,
        dados.sub,
        dados.valor,
        dados.forma,
        dados.obs
      );
    }

    await enviarMensagem(from,
      `✅ ${dados.tipo} R$ ${dados.valor} via ${dados.forma}`
    );

    return res.sendStatus(200);

  } catch (e) {
    console.log("🔥 ERRO:", e.message);
    return res.sendStatus(200);
  }
});


// ================= START =================

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Servidor ativo");
});
