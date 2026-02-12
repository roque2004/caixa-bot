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

const gatilhosSaida = [
  "paguei","pago","gastei","gasto","comprei","dei","pro","pra","para"
];

const gatilhosEntrada = [
  "vendi","venda","vendas","recebi","entrada","entrou"
];

function detectarForma(msg){
  for(const k in formas){
    if(msg.includes(k)) return formas[k];
  }
  return null;
}

function detectarTipo(msg){
  if(gatilhosSaida.some(g=>msg.includes(g))) return "SAIDA";
  if(gatilhosEntrada.some(g=>msg.includes(g))) return "ENTRADA";
  return null;
}

function detectarCategoria(msg){
  if(msg.includes("padeiro")) return ["fornecedor","padeiro"];
  if(msg.includes("mercado")) return ["insumos","mercado"];
  if(msg.includes("entregador")) return ["mao_obra","entregador"];
  return ["outros","geral"];
}

function extrairValorPrincipal(msg){
  const nums = msg.match(/\d+[.,]?\d*/g);
  if(!nums) return null;
  return parseFloat(nums[0].replace(",","."));
}

function limparObs(original){

  let obs = original;

  // remove comandos
  gatilhosSaida.concat(gatilhosEntrada).forEach(w=>{
    obs = obs.replace(new RegExp(w,"ig"),"");
  });

  // remove formas
  Object.keys(formas).forEach(w=>{
    obs = obs.replace(new RegExp(w,"ig"),"");
  });

  // remove categoria palavras
  ["padeiro","mercado","entregador"].forEach(w=>{
    obs = obs.replace(new RegExp(w,"ig"),"");
  });

  // remove primeiro número (valor principal)
  obs = obs.replace(/\d+[.,]?\d*/,"");

  // remove conectores
  obs = obs.replace(/\b(no|na|pro|pra|para|em)\b/ig,"");

  return obs.trim();
}

function parse(texto){

  const msg = texto.toLowerCase();

  const tipo = detectarTipo(msg);
  if(!tipo) return null;

  const valor = extrairValorPrincipal(msg);
  if(!valor) return null;

  const forma = detectarForma(msg);
  const [cat,sub] = detectarCategoria(msg);
  const obs = limparObs(msg);

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
