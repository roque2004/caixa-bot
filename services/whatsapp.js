const axios = require("axios");

async function enviarMensagem(numero, texto) {

  await axios.post(
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

}

module.exports = { enviarMensagem };
