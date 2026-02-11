const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

async function salvarCaixa(tipo, valor, forma, obs) {
  const client = await auth.getClient();

  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId: process.env.SHEET_ID,
    range: "CAIXA!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toLocaleString("pt-BR"),
        tipo,
        valor,
        forma,
        obs
      ]]
    }
  });
}

async function salvarGasto(cat, sub, valor, forma, obs) {
  const client = await auth.getClient();

  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId: process.env.SHEET_ID,
    range: "GASTOS!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toLocaleString("pt-BR"),
        cat,
        sub,
        valor,
        forma,
        obs
      ]]
    }
  });
}

async function salvarFechamentoCompleto(d) {
  const client = await auth.getClient();

  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId: process.env.SHEET_ID,
    range: "FECHAMENTO!A:O",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toLocaleDateString(),
        d.total,
        d.caixaInicial,
        d.dinheiro,
        d.debito,
        d.credito,
        d.pix,
        d.ifood,
        d.sangria,
        d.caixaEsperado,
        d.caixaReal,
        d.diffCaixa,
        d.maqEsperada,
        d.maqReal,
        d.diffMaq
      ]]
    }
  });
}

module.exports = {
  salvarCaixa,
  salvarGasto,
  salvarFechamentoCompleto
};
