const { google } = require("googleapis");

// ================= AUTH =================

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({ version: "v4", auth });

function agora(){
  return new Date().toLocaleString("pt-BR");
}

function hoje(){
  return new Date().toLocaleDateString("pt-BR");
}

// ================= CAIXA PRO =================
// CAIXA!A:I
// DATA | TIPO | VALOR | FORMA | CATEGORIA | SUB | OBS | MSG_ID | MIDIA

async function salvarCaixa(
  tipo,
  valor,
  forma,
  obs,
  cat = "",
  sub = "",
  msgId = "",
  midia = ""
){
  if(!process.env.SHEET_ID){
    console.log("⚠️ SHEET_ID não configurado");
    return;
  }

  const client = await auth.getClient();

  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId: process.env.SHEET_ID,
    range: "CAIXA!A:I",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        agora(),
        tipo,
        valor,
        forma,
        cat,
        sub,
        obs,
        msgId,
        midia
      ]]
    }
  });

  console.log("✅ CAIXA salvo");
}


// ================= GASTOS PRO =================
// GASTOS!A:H
// DATA | CAT | SUB | VALOR | FORMA | OBS | MSG_ID | MIDIA

async function salvarGasto(
  cat,
  sub,
  valor,
  forma,
  obs,
  msgId = "",
  midia = ""
){
  if(!process.env.SHEET_ID){
    console.log("⚠️ SHEET_ID não configurado");
    return;
  }

  const client = await auth.getClient();

  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId: process.env.SHEET_ID,
    range: "GASTOS!A:H",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        agora(),
        cat,
        sub,
        valor,
        forma,
        obs,
        msgId,
        midia
      ]]
    }
  });

  console.log("💸 GASTO salvo");
}


// ================= FECHAMENTO (mantido) =================

async function salvarFechamentoCompleto(d) {

  if(!process.env.SHEET_ID){
    console.log("⚠️ SHEET_ID não configurado");
    return;
  }

  const client = await auth.getClient();

  await sheets.spreadsheets.values.append({
    auth: client,
    spreadsheetId: process.env.SHEET_ID,
    range: "FECHAMENTO!A:O",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        hoje(),
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

  console.log("🧾 FECHAMENTO salvo");
}


// ================= EXPORT =================

module.exports = {
  salvarCaixa,
  salvarGasto,
  salvarFechamentoCompleto
};
