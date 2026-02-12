const mem = {};

function setMem(user, key, val){
  if(!mem[user]) mem[user] = {};
  mem[user][key] = val;
}

function getMem(user, key){
  return mem[user]?.[key];
}

function clearMem(user, key){
  if(mem[user]) delete mem[user][key];
}

module.exports = {
  setMem,
  getMem,
  clearMem
};
