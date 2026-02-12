require("dotenv").config();
const express = require("express");

const { parse } = require("./logic/nlp");
const { ehDuplicado } = require("./logic/guard");
const { salvarBuffer } = require("./services/storage");
const { baixarMidia } = require("./services/media");
const { transcrever } = require("./services/audio");

const {
  salvarCaixa,
  salvarGasto
} = require("./services/sheets");

const { enviarMensagem } = require("./services/whatsapp");

const pendencias = {};

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "caixabot123";


// ================= WEBHOOK VERIFY =================

app.get("/webhook",(req,res)=>{
  if(req.query["hub.verify_token"] === VERIFY_TOKEN){
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});


// ================= WEBHOOK POST =================

app.post("/webhook", async (req,res)=>{

try{

const m = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
if(!m) return res.sendStatus(200);

const from = m.from;


// ---------- TEXTO ----------

if(m.text){

  const texto = m.text.body;
  console.log("📩", texto);

  if(ehDuplicado(from,texto)){
    console.log("♻️ duplicado ignorado");
    return res.sendStatus(200);
  }

  // pendência forma
  if(pendencias[from]){
    const forma = parse(texto)?.forma;
    if(forma){
      const d = pendencias[from];
      await salvarCaixa(d.tipo,d.valor,forma,d.obs);
      if(d.tipo==="SAIDA")
        await salvarGasto(d.cat,d.sub,d.valor,forma,d.obs);

      delete pendencias[from];
      await enviarMensagem(from,"✅ Lançado");
      return res.sendStatus(200);
    }
  }

  const dados = parse(texto);
  if(!dados) return res.sendStatus(200);

  if(!dados.forma){
    pendencias[from] = dados;

    await enviarMensagem(from,
      "Qual a forma de pagamento? pix, dinheiro, debito ou credito");

    setTimeout(async()=>{
      if(!pendencias[from]) return;
      const d = pendencias[from];

      await salvarCaixa(d.tipo,d.valor,"PIX",d.obs);
      if(d.tipo==="SAIDA")
        await salvarGasto(d.cat,d.sub,d.valor,"PIX",d.obs);

      delete pendencias[from];
    },120000);

    return res.sendStatus(200);
  }

  await salvarCaixa(dados.tipo,dados.valor,dados.forma,dados.obs);

  if(dados.tipo==="SAIDA")
    await salvarGasto(dados.cat,dados.sub,dados.valor,dados.forma,dados.obs);

  await enviarMensagem(from,
    `✅ ${dados.tipo} R$${dados.valor} via ${dados.forma}`);

  return res.sendStatus(200);
}


// ---------- IMAGEM ----------

if(m.image){

  const buffer = await baixarMidia(m.image.id);
  const nome = salvarBuffer(buffer,"jpg");

  await enviarMensagem(from,
    `📎 Comprovante salvo: ${nome}`);

  return res.sendStatus(200);
}


// ---------- DOCUMENTO / PDF ----------

if(m.document){

  const ext = m.document.filename?.split(".").pop() || "pdf";
  const buffer = await baixarMidia(m.document.id);
  const nome = salvarBuffer(buffer,ext);

  await enviarMensagem(from,
    `📄 Documento salvo: ${nome}`);

  return res.sendStatus(200);
}


// ---------- ÁUDIO ----------

if(m.audio){

  const buffer = await baixarMidia(m.audio.id);
  const nome = salvarBuffer(buffer,"ogg");

  const texto = await transcrever(`uploads/${nome}`);

  await enviarMensagem(from,
    `🎤 Entendi: "${texto}"`);

  const dados = parse(texto);
  if(dados){
    await salvarCaixa(dados.tipo,dados.valor,
      dados.forma || "PIX",
      dados.obs);

    await enviarMensagem(from,"✅ Lançado do áudio");
  }

  return res.sendStatus(200);
}


}catch(e){
 console.log("🔥",e.message);
}

res.sendStatus(200);
});


// ================= START =================

app.listen(process.env.PORT || 3000,()=>{
  console.log("🧠 CaixaBot MASTER ativo");
});
