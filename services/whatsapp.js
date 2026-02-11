const axios = require("axios");

async function enviarMensagem(numero, texto) {
  try {

    const r = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: numero,
        text: { body: texto }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("📤 WhatsApp enviado:", r.data);

  } catch (err) {
    console.log("❌ ERRO WHATSAPP:");
    console.log(err.response?.data || err.message);
  }
}

module.exports = { enviarMensagem };
