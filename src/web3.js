const host = process.argv[2];
const port = process.argv[3];

const Web3 = require('web3');
module.exports = new Web3(`ws://${host}:${port}`);
