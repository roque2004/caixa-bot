function norm(t){
  return t.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");
}

const MAP_ERROS = {
  gatos:"gastos",
  saindas:"saidas"
};

function corrigir(txt){
  let t = txt;
  for(const e in MAP_ERROS)
    t = t.replaceAll(e, MAP_ERROS[e]);
  return t;
}

const FORMAS = {
  PIX:["pix"],
  DINHEIRO:["dinheiro","cash"],
  DEBITO:["debito"],
  CREDITO:["credito"]
};

const SAIDA = ["paguei","pago","dei","gastei","comprei","pra","pro","para"];
const ENTRADA = ["vendi","vendas","entrada","entrou","recebi"];

function detectarForma(t){
  for(const f in FORMAS)
    if(FORMAS[f].some(p=>t.includes(p))) return f;
  return null;
}

function detectarTipo(t){
  if(SAIDA.some(p=>t.includes(p))) return "SAIDA";
  if(ENTRADA.some(p=>t.includes(p))) return "ENTRADA";
  return null;
}

function categoria(t){
  if(t.includes("padeiro")) return ["fornecedor","padeiro"];
  if(t.includes("frios")) return ["insumo","frios"];
  if(t.includes("entregador")) return ["mao_obra","entregador"];
  if(t.includes("auxiliar")) return ["mao_obra","auxiliar"];
  return ["outros","geral"];
}

function valores(t){
  return (t.match(/\d+[.,]?\d*/g)||[])
    .map(v=>parseFloat(v.replace(",",".")));
}

function obs(original){
  const p = original.split(",");
  return p.length>1 ? p.slice(1).join(",").trim() : "";
}

function parse(texto){

  let t = norm(texto);
  t = corrigir(t);

  const tipo = detectarTipo(t);
  if(!tipo) return null;

  const nums = valores(t);
  if(!nums.length) return null;

  const forma = detectarForma(t);
  const [cat,sub] = categoria(t);

  return {
    tipo,
    valor: nums[0],
    forma,
    cat,
    sub,
    obs: obs(texto),
    extras: nums.slice(1)
  };
}

module.exports = { parse };
