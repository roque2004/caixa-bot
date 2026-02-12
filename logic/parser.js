function limpar(txt){
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ===== DICIONÁRIOS =====

const FORMAS = {
  PIX: ["pix"],
  DINHEIRO: ["dinheiro","cash"],
  DEBITO: ["debito","cartao debito","débito"],
  CREDITO: ["credito","cartao credito","crédito"]
};

const GATILHOS_SAIDA = [
  "paguei","pago","dei","gastei","comprei","pagar","pg","pro","pra"
];

const GATILHOS_ENTRADA = [
  "vendi","venda","vendas","recebi","entrou","entrada"
];

const FORNECEDOR = ["padeiro","mercado","frios","acougue"];
const MAO_OBRA = ["entregador","auxiliar","chapa"];

// ===== DETECÇÕES =====

function detectarForma(txt){
  for(const tipo in FORMAS){
    for(const p of FORMAS[tipo]){
      if(txt.includes(p)) return tipo;
    }
  }
  return null;
}

function detectarTipo(txt){
  if(GATILHOS_SAIDA.some(w=>txt.includes(w))) return "SAIDA";
  if(GATILHOS_ENTRADA.some(w=>txt.includes(w))) return "ENTRADA";
  return null;
}

function detectarCategoria(txt){
  if(FORNECEDOR.some(w=>txt.includes(w)))
    return { cat:"fornecedor", sub:"geral" };

  if(MAO_OBRA.some(w=>txt.includes(w)))
    return { cat:"mao_obra", sub:"diaria" };

  return { cat:"outros", sub:"geral" };
}

function extrairValor(txt){
  const nums = txt.match(/\d+[.,]?\d*/g);
  if(!nums) return null;
  return parseFloat(nums[0].replace(",","."));
}

// ===== LIMPEZA DE OBS =====

function limparObs(original){

  let obs = limpar(original);

  // remove gatilhos
  GATILHOS_SAIDA.concat(GATILHOS_ENTRADA).forEach(w=>{
    obs = obs.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  // remove formas
  Object.values(FORMAS).flat().forEach(w=>{
    obs = obs.replace(new RegExp("\\b"+limpar(w)+"\\b","g"),"");
  });

  // remove categorias
  FORNECEDOR.concat(MAO_OBRA).forEach(w=>{
    obs = obs.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  // remove conectores
  ["no","na","pro","pra","para","em","do","da"].forEach(w=>{
    obs = obs.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  // remove primeiro valor (valor principal)
  obs = obs.replace(/\d+[.,]?\d*/,"");

  // limpa espaços
  obs = obs.replace(/\s+/g," ").trim();

  return obs;
}

// ===== PARSER PRINCIPAL =====

function parse(texto){

  const t = limpar(texto);

  const tipo = detectarTipo(t);
  if(!tipo) return null;

  const valor = extrairValor(t);
  if(!valor) return null;

  const forma = detectarForma(t);
  const { cat, sub } = detectarCategoria(t);
  const obs = limparObs(texto);

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
