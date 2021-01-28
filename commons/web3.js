const { host, port } = require("../web3-config");
const Web3 = require('web3');

module.exports = new Web3(`ws://${host}:${port}`);
