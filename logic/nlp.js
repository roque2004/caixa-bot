function limpar(txt){
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");
}


// ================= DICIONÁRIOS =================

const FORMAS = {
  PIX: ["pix"],
  DINHEIRO: ["dinheiro","cash"],
  DEBITO: ["debito","cartao debito"],
  CREDITO: ["credito","cartao credito"]
};

const GATILHOS_SAIDA = [
  "paguei","pago","dei","gastei","comprei","pg","pague"
];

const GATILHOS_ENTRADA = [
  "vendi","venda","vendas","recebi","entrou","entrada"
];

const FORNECEDORES = {
  padeiro:["padeiro","padaria"],
  mercado:["mercado"],
  frios:["frios"],
  acougue:["acougue"]
};

const MAO_OBRA = {
  entregador:["entregador","motoboy"],
  auxiliar:["auxiliar"],
  chapa:["chapa"]
};

const CONECTORES = [
  "no","na","pra","pro","para","em","do","da","o","a","e"
];


// ================= HELPERS =================

function detectarTipo(txt){
  if(GATILHOS_SAIDA.some(w=>txt.includes(w))) return "SAIDA";
  if(GATILHOS_ENTRADA.some(w=>txt.includes(w))) return "ENTRADA";
  return null;
}

function detectarForma(txt){
  for(const tipo in FORMAS){
    if(FORMAS[tipo].some(w=>txt.includes(w))){
      return tipo;
    }
  }
  return null;
}

function detectarCategoria(txt){

  for(const sub in MAO_OBRA){
    if(MAO_OBRA[sub].some(w=>txt.includes(w))){
      return { cat:"mao_obra", sub };
    }
  }

  for(const sub in FORNECEDORES){
    if(FORNECEDORES[sub].some(w=>txt.includes(w))){
      return { cat:"fornecedor", sub };
    }
  }

  return { cat:"outros", sub:"geral" };
}


// ================= SEGMENTADOR =================

function dividir(txt){
  return txt
    .replace(/\+/g," e ")
    .replace(/\//g," e ")
    .split(/,| e /g)
    .map(s=>s.trim())
    .filter(Boolean);
}


// ================= VALOR =================

function extrairValor(seg){
  const m = seg.match(/\d+[.,]?\d*/);
  if(!m) return null;
  return parseFloat(m[0].replace(",","."));
}


// ================= OBS LIMPA =================

function limparObs(seg, valor){

  let t = limpar(seg);

  [...GATILHOS_SAIDA, ...GATILHOS_ENTRADA]
    .forEach(w=> t = t.replace(new RegExp("\\b"+w+"\\b","g"),""));

  Object.values(FORMAS).flat()
    .forEach(w=> t = t.replace(new RegExp("\\b"+w+"\\b","g"),""));

  CONECTORES.forEach(w=>{
    t = t.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  if(valor){
    const r = new RegExp(valor.toString().replace(".","\\."));
    t = t.replace(r,"");
  }

  return t.replace(/\s+/g," ").trim();
}


// ================= PARSER =================

function parse(textoOriginal){

  const txt = limpar(textoOriginal);

  const tipo = detectarTipo(txt);
  if(!tipo) return null;

  const formaGlobal = detectarForma(txt);

  const partes = dividir(txt);

  const lista = [];

  for(const seg of partes){

    const valor = extrairValor(seg);
    if(!valor) continue;

    const formaLocal = detectarForma(seg);

    const forma = formaLocal || formaGlobal || null;

    const cat = detectarCategoria(seg);

    const obs = limparObs(seg, valor);

    lista.push({
      tipo,
      valor,
      forma,
      cat: cat.cat,
      sub: cat.sub,
      obs
    });
  }

  if(lista.length === 0) return null;

  return lista;
}


module.exports = { parse };
