const { google } = require("googleapis");

async function salvarFechamento(dados) {
  if (!process.env.SHEET_ID) {
    console.log("⚠️ SHEET_ID não configurado. Pulando gravação.");
    return;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: "FECHAMENTO!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[dados.data, dados.observacao]]
    }
  });

  console.log("✅ Registro salvo na planilha");
}

module.exports = { salvarFechamento };
