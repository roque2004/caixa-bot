const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");

const DIR = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(DIR)) {
  fs.mkdirSync(DIR);
}

function salvarBuffer(buffer, ext){
  const nome = uuid() + "." + ext;
  const full = path.join(DIR, nome);
  fs.writeFileSync(full, buffer);
  return nome;
}

module.exports = { salvarBuffer };
