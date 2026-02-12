const ult = {};

function ehDuplicado(user, texto){

  const now = Date.now();
  const u = ult[user];

  ult[user] = { texto, ts: now };

  if(!u) return false;

  return (
    u.texto === texto &&
    (now - u.ts) < 10000
  );
}

module.exports = { ehDuplicado };
