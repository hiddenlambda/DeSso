const web3 = require('../src/web3');

const privateKey = `0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709`;
(() => {
    // understanding the ecdsa signing and verification infra
    account = web3.eth.accounts.privateKeyToAccount(privateKey);
    console.log(account.address == web3.eth.accounts.recover(account.sign("Hello")));
})();
