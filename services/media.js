const axios = require("axios");

async function baixarMidia(mediaId){

  const meta = await axios.get(
    `https://graph.facebook.com/v22.0/${mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
      }
    }
  );

  const url = meta.data.url;

  const arq = await axios.get(url, {
    responseType: "arraybuffer",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
    }
  });

  return arq.data;
}

module.exports = { baixarMidia };
