const contract = require('@truffle/contract');
const BaseAuthority = require('../build/contracts/BaseAuthority.json');
const web3 = require('../commons/web3');

const authorityContract = contract(BaseAuthority);
authorityContract.setProvider(web3.currentProvider);

main = async () => {
    authorityContractInstance = await authorityContract.deployed();
    authorityContractInstance.NewRequest().on('data', (event => {
        console.log(event);
    }));
};

main().catch((err) => console.log(err));
