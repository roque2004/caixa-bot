function norm(t){
  return t.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");
}

const formas = {
  pix: "PIX",
  dinheiro: "DINHEIRO",
  debito: "DEBITO",
  credito: "CREDITO"
};

const saida = ["paguei","pago","dei","gastei","comprei","pro","pra"];
const entrada = ["vendi","recebi","entrou","entrada"];

function detectarForma(t){
  for(const k in formas){
    if(t.includes(k)) return formas[k];
  }
  return null;
}

function detectarTipo(t){
  if(saida.some(w=>t.includes(w))) return "SAIDA";
  if(entrada.some(w=>t.includes(w))) return "ENTRADA";
  return null;
}

function detectarValor(t){
  const m = t.match(/\d+[.,]?\d*/);
  if(!m) return null;
  return parseFloat(m[0].replace(",","."));
}

function limparObs(orig){

  let o = norm(orig);

  [...saida,...entrada,"pix","dinheiro","debito","credito"]
  .forEach(w=>{
    o = o.replace(new RegExp(`\\b${w}\\b`,"g")," ");
  });

  o = o.replace(/\d+[.,]?\d*/," ");
  o = o.replace(/\s+/g," ").trim();

  return o;
}

function parse(texto){

  const t = norm(texto);

  const tipo = detectarTipo(t);
  if(!tipo) return null;

  const valor = detectarValor(t);
  if(!valor) return null;

  return {
    tipo,
    valor,
    forma: detectarForma(t),
    cat: "outros",
    sub: "geral",
    obs: limparObs(texto)
  };
}

module.exports = { parse };
