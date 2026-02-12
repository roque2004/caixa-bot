function normalizar(txt){
  return txt
    .toLowerCase()
    .replace(/reias|reais/g,"reais")
    .replace(/gatos/g,"gastos")
    .replace(/[.,]/g," ")
    .replace(/\s+/g," ")
}


// ================= DICIONÁRIOS =================

const entradas = [
  "vendi","venda","vendas","recebi","entrou","entrada","faturei"
];

const saidas = [
  "paguei","pago","pagamento","gastei","gasto",
  "comprei","dei","dei pro","dei pra","transferi"
];

const formas = {
  pix: "PIX",
  dinheiro: "DINHEIRO",
  debito: "DEBITO",
  débito: "DEBITO",
  credito: "CREDITO",
  crédito: "CREDITO",
  cartao: "CREDITO",
  cartão: "CREDITO"
};


// ================= CATEGORIAS =================

const mapaCat = [
  {k:["padeiro","pao"], c:"fornecedor", s:"padeiro"},
  {k:["ifood"], c:"taxa", s:"ifood"},
  {k:["entregador","motoboy"], c:"mão de obra", s:"entregador"},
  {k:["auxiliar","funcionario"], c:"mão de obra", s:"auxiliar"},
  {k:["mercado"], c:"insumos", s:"mercado"},
  {k:["gas","gasolina"], c:"deslocamento", s:"combustivel"},
  {k:["embalagem","sacola"], c:"insumos", s:"embalagem"},
];


// ================= CORE =================

function detectarTipo(txt){

  if(entradas.some(w=>txt.includes(w))) return "ENTRADA";
  if(saidas.some(w=>txt.includes(w))) return "SAIDA";

  return null;
}


function detectarForma(txt){

  const tokens = txt.split(" ");

  for(const t of tokens){

    if(formas[t]) return formas[t];

  }

  // fallback regex palavra inteira
  for(const k in formas){
    const r = new RegExp("\\b"+k+"\\b");
    if(r.test(txt)) return formas[k];
  }

  return null;
}


function detectarValor(txt){
  const m = txt.match(/\d+[.,]?\d*/);
  if(!m) return null;
  return parseFloat(m[0].replace(",","."));
}


function detectarCategoria(txt){
  for(const item of mapaCat){
    if(item.k.some(k=>txt.includes(k))){
      return {cat:item.c, sub:item.s};
    }
  }
  return {cat:"outros", sub:"geral"};
}


// ================= OBS INTELIGENTE =================

function extrairObs(txt, valor, forma){

  let o = txt;

  // remove gatilho ação
  [...entradas,...saidas].forEach(w=>{
    o = o.replace(w,"");
  });

  // remove valor
  if(valor) o = o.replace(valor.toString(),"");

  // remove forma
  if(forma){
    Object.keys(formas).forEach(k=>{
      o = o.replace(k,"");
    });
  }

  // remove conectivos lixo
  o = o.replace(/\b(no|na|pro|pra|para|de|do|da|em|no)\b/g,"");

  return o.trim();
}


// ================= PARSER V4 =================

function parse(texto){

  if(!texto) return null;

  const txt = normalizar(texto);

  const tipo = detectarTipo(txt);
  if(!tipo) return null;

  const valor = detectarValor(txt);
  if(!valor) return null;

  const forma = detectarForma(txt);

  const {cat, sub} = detectarCategoria(txt);

  const obs = extrairObs(txt, valor, forma);

  return {
    tipo,
    valor,
    forma,
    cat,
    sub,
    obs
  };
}


module.exports = { parse };
