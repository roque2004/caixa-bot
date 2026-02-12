function limpar(txt){
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const PAGAMENTO = {
  pix: ["pix"],
  dinheiro: ["dinheiro","cash"],
  debito: ["debito","débito","cartao debito"],
  credito: ["credito","crédito","cartao credito"]
};

const SAIDA = ["paguei","pago","dei","gastei","comprei"];
const ENTRADA = ["vendi","venda","vendas","recebi","entrou"];

const FORNECEDOR = ["padeiro","frios","acougue","mercado"];
const MAO_OBRA = ["entregador","auxiliar","chapa"];

function detectarPagamento(txt){
  for(const tipo in PAGAMENTO){
    for(const p of PAGAMENTO[tipo]){
      if(txt.includes(p)) return tipo.toUpperCase();
    }
  }
  return "DINHEIRO";
}

function detectarTipo(txt){
  if(SAIDA.some(p=>txt.includes(p))) return "SAIDA";
  if(ENTRADA.some(p=>txt.includes(p))) return "ENTRADA";
  return null;
}

function detectarCategoria(txt){
  if(FORNECEDOR.some(p=>txt.includes(p)))
    return {cat:"fornecedor", sub:"geral"};
  if(MAO_OBRA.some(p=>txt.includes(p)))
    return {cat:"mao_obra", sub:"diaria"};
  return {cat:"outros", sub:"geral"};
}

function extrairValor(txt){
  const nums = txt.match(/\d+[.,]?\d*/g);
  if(!nums) return null;
  return parseFloat(nums[0].replace(",","."));
}

function limparObs(original){

  let obs = original.toLowerCase();

  // remove gatilhos
  gatilhosSaida.concat(gatilhosEntrada).forEach(w=>{
    obs = obs.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  // remove formas pagamento
  Object.keys(formas).forEach(w=>{
    obs = obs.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  // remove categorias conhecidas
  ["padeiro","mercado","entregador"].forEach(w=>{
    obs = obs.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  // remove conectores
  ["no","na","pro","pra","para","em","do","da"].forEach(w=>{
    obs = obs.replace(new RegExp("\\b"+w+"\\b","g"),"");
  });

  // remove primeiro valor (valor principal)
  obs = obs.replace(/\d+[.,]?\d*/,"");

  // limpa espaços extras
  obs = obs.replace(/\s+/g," ").trim();

  return obs;
}


function extrairObs(txt){
  const partes = txt.split(",");
  if(partes.length < 2) return "";
  return partes.slice(1).join(",").trim();
}

function parseMensagem(texto){

  const t = limpar(texto);

  const tipo = detectarTipo(t);
  if(!tipo) return null;

  const valor = extrairValor(t);
  if(!valor) return null;

  const forma = detectarPagamento(t);
  const categoria = detectarCategoria(t);
  const obs = extrairObs(texto);

  return {
    tipo,
    valor,
    forma,
    categoria,
    obs
  };
}

module.exports = { parseMensagem };
