function limpar(t){
  return t.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");
}

const GATILHOS = ["paguei","pago","dei","gastei","comprei","recebi","vendi"];

const FORMAS = {
  PIX:["pix"],
  DINHEIRO:["dinheiro"],
  DEBITO:["debito"],
  CREDITO:["credito"]
};

function detectarForma(t){
  for(const k in FORMAS){
    if(FORMAS[k].some(p=>t.includes(p))) return k;
  }
  return null;
}

function detectarCat(t){
  if(t.includes("padeiro")) return ["fornecedor","padeiro"];
  if(t.includes("mercado")) return ["fornecedor","mercado"];
  if(t.includes("entregador")) return ["mao_obra","entregador"];
  return ["outros","geral"];
}

// divide por gatilhos → múltiplos eventos
function quebrarEventos(t){
  const partes = t.split(
    new RegExp(`\\b(${GATILHOS.join("|")})\\b`)
  );

  const eventos = [];

  for(let i=1;i<partes.length;i+=2){
    eventos.push(partes[i]+" "+partes[i+1]);
  }

  return eventos.length ? eventos : [t];
}

function extrairValor(txt){
  const n = txt.match(/\d+[.,]?\d*/);
  if(!n) return null;
  return parseFloat(n[0].replace(",","."));  
}

function limparObs(txt){

  let o = limpar(txt);

  GATILHOS.forEach(w=>{
    o = o.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  Object.values(FORMAS).flat().forEach(w=>{
    o = o.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  ["no","na","pro","pra","para","em","do","da"].forEach(w=>{
    o = o.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  o = o.replace(/\d+[.,]?\d*/,"");

  return o.replace(/\s+/g," ").trim();
}

function parse(texto){

  const t = limpar(texto);
  const formaGlobal = detectarForma(t);

  const eventos = quebrarEventos(t);

  const saidas = [];

  for(const ev of eventos){

    const valor = extrairValor(ev);
    if(!valor) continue;

    const [cat,sub] = detectarCat(ev);

    saidas.push({
      tipo:"SAIDA",
      valor,
      forma: formaGlobal,
      cat,
      sub,
      obs: limparObs(ev)
    });
  }

  return saidas.length ? saidas : null;
}

module.exports = { parse };
