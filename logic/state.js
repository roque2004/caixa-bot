const pendencias = {};

function salvarPendencia(numero, dados){
  pendencias[numero] = { dados, ts: Date.now() };
}

function pegarPendencia(numero){
  return pendencias[numero];
}

function limparPendencia(numero){
  delete pendencias[numero];
}

module.exports = { salvarPendencia, pegarPendencia, limparPendencia };
