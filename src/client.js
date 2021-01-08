const BaseAuthority = require('../build/contracts/BaseAuthority.json');
const Service = require('../build/contracts/Service.json');

const contract = require('@truffle/contract');

const web3 = require('./web3');

const authorityContract = contract(BaseAuthority);
authorityContract.setProvider(web3.currentProvider);

const serviceContract = contract(Service);
serviceContract.setProvider(web3.currentProvider);

main = async () => {
    accounts = await web3.eth.getAccounts();
    authorityContractInstance = await authorityContract.deployed();
    serviceContractInstance = await serviceContract.deployed();
    attribute = await serviceContractInstance.createAttribute(
        web3.utils.fromAscii("very-secure-mask-for-pii"),
        serviceContractInstance.contract.options.address,
        { from: accounts[1] }
    );
    console.log(attribute);

    identity = await serviceContractInstance.createIdentity(
        web3.utils.fromAscii("very-secure-public-key"),
        [attribute],
        { from: accounts[1] }
    );
    console.log(identity);

    identity.replacePublicKey(attribute, "extremely-secure-public-key", { from: accounts[1] });
};

main().catch((err) => console.log(err))
    .finally(() => { web3.currentProvider.connection.close() });
