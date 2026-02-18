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
  DEBITO: ["debito","cartao debito","cartao de debito"],
  CREDITO: ["credito","cartao credito","cartao de credito"]
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
  acougue:["acougue","açougue"]
};

const MAO_OBRA = {
  entregador:["entregador","motoboy"],
  auxiliar:["auxiliar"],
  chapa:["chapa"]
};

const CONECTORES = [
  "no","na","pra","pro","para","em","do","da","o","a"
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

  for(const sub in FORNECEDORES){
    if(FORNECEDORES[sub].some(w=>txt.includes(w))){
      return { cat:"fornecedor", sub };
    }
  }

  for(const sub in MAO_OBRA){
    if(MAO_OBRA[sub].some(w=>txt.includes(w))){
      return { cat:"mao_obra", sub };
    }
  }

  return { cat:"outros", sub:"geral" };
}

function extrairNumeros(txt){
  const nums = txt.match(/\d+[.,]?\d*/g);
  if(!nums) return [];
  return nums.map(n => parseFloat(n.replace(",", ".")));
}


// ================= OBS LIMPA PRO =================

function limparObs(original, valorPrincipal){

  let t = limpar(original);

  // remove gatilhos
  [...GATILHOS_SAIDA, ...GATILHOS_ENTRADA]
    .forEach(w=>{
      t = t.replace(new RegExp("\\b"+w+"\\b","g"),"");
    });

  // remove formas
  Object.values(FORMAS).flat()
    .forEach(w=>{
      t = t.replace(new RegExp("\\b"+w+"\\b","g"),"");
    });

  // remove conectores
  CONECTORES.forEach(w=>{
    t = t.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  // remove categorias conhecidas
  Object.values(FORNECEDORES).flat()
    .concat(Object.values(MAO_OBRA).flat())
    .forEach(w=>{
      t = t.replace(new RegExp("\\b"+w+"\\b","g"),"");
    });

  // remove valor principal (só o primeiro)
  if(valorPrincipal){
    const r = new RegExp(valorPrincipal.toString().replace(".","\\."));
    t = t.replace(r,"");
  }

  return t.replace(/\s+/g," ").trim();
}


// ================= PARSER MASTER =================

function parse(textoOriginal){

  const txt = limpar(textoOriginal);

  const tipo = detectarTipo(txt);
  if(!tipo) return null;

  const formaDetectada = detectarForma(txt);
  const categoria = detectarCategoria(txt);

  const valores = extrairNumeros(txt);
  if(valores.length === 0) return null;

  // ✅ MULTI LANÇAMENTO
  const lista = valores.map((valor, idx)=>{

    const obs = limparObs(textoOriginal, valores[0]);

    return {
      tipo,
      valor,
      forma: formaDetectada, // pode ser null → index.js faz fallback PIX
      cat: categoria.cat,
      sub: categoria.sub,
      obs
    };
  });

  return lista;
}

module.exports = { parse };
