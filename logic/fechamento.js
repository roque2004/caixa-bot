const { salvarFechamento } = require("../services/sheets");

async function processMessage(texto) {
  console.log("📊 Texto recebido:", texto);

  // Por enquanto só salva o texto cru
  await salvarFechamento({
    data: new Date().toLocaleDateString(),
    observacao: texto
  });
}

module.exports = { processMessage };
