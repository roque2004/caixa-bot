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


// ================= VERIFY =================

app.get("/webhook",(req,res)=>{
  if(req.query["hub.verify_token"] === VERIFY_TOKEN){
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});


// ================= POST =================

app.post("/webhook", async (req,res)=>{

try{

const m = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
if(!m) return res.sendStatus(200);

const from = m.from;


// ================= TEXTO =================

if(m.text){

  const texto = m.text.body;
  console.log("📩", texto);

  if(ehDuplicado(from,texto)){
    console.log("♻️ duplicado ignorado");
    return res.sendStatus(200);
  }

  const lista = parse(texto);
  if(!lista) return res.sendStatus(200);

  for(const dados of lista){

    await salvarCaixa(
      dados.tipo,
      dados.valor,
      dados.forma || "PIX",
      dados.obs
    );

    if(dados.tipo==="SAIDA"){
      await salvarGasto(
        dados.cat,
        dados.sub,
        dados.valor,
        dados.forma || "PIX",
        dados.obs
      );
    }
  }

  await enviarMensagem(from,
    `✅ ${lista.length} lançamento(s) registrado(s)`);

  return res.sendStatus(200);
}


// ================= IMAGEM =================

if(m.image){

  const buffer = await baixarMidia(m.image.id);
  const nome = salvarBuffer(buffer,"jpg");

  await enviarMensagem(from,
    `📎 Comprovante salvo: ${nome}`);

  return res.sendStatus(200);
}


// ================= PDF =================

if(m.document){

  const ext = m.document.filename?.split(".").pop() || "pdf";
  const buffer = await baixarMidia(m.document.id);
  const nome = salvarBuffer(buffer,ext);

  await enviarMensagem(from,
    `📄 Documento salvo: ${nome}`);

  return res.sendStatus(200);
}


// ================= AUDIO =================

if(m.audio){

  const buffer = await baixarMidia(m.audio.id);
  const nome = salvarBuffer(buffer,"ogg");

  const texto = await transcrever(`uploads/${nome}`);

  await enviarMensagem(from,
    `🎤 Entendi: "${texto}"`);

  const lista = parse(texto);

  if(lista){
    for(const dados of lista){

      await salvarCaixa(
        dados.tipo,
        dados.valor,
        dados.forma || "PIX",
        dados.obs
      );

      if(dados.tipo==="SAIDA"){
        await salvarGasto(
          dados.cat,
          dados.sub,
          dados.valor,
          dados.forma || "PIX",
          dados.obs
        );
      }
    }

    await enviarMensagem(from,
      `✅ ${lista.length} lançamento(s) do áudio`);
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
