const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

async function salvarCaixa(tipo, valor, forma, obs) {

  if (!process.env.SHEET_ID) {
    console.log("❌ SHEET_ID não configurado");
    return;
  }

  const client = await auth.getClient();

  const data = new Date().toLocaleString("pt-BR");

  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId: process.env.SHEET_ID,
    range: "CAIXA!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[data, tipo, valor, forma, obs]]
    }
  });

  console.log("📊 Linha inserida no Sheets");
}

module.exports = { salvarCaixa };
