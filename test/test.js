const contract = require('@truffle/contract');
const { expect } = require('chai');

before(() => {
    this.web3 = require('../commons/web3');
    authorityContract.setProvider(this.web3.currentProvider);
    relationshipContract.setProvider(this.web3.currentProvider);
    identityContract.setProvider(this.web3.currentProvider);
    identityActionContract.setProvider(this.web3.currentProvider);
});

after(() => {
    this.web3.currentProvider.connection.close();
});

const BaseAuthority = require('../build/contracts/BaseAuthority.json');
const authorityContract = contract(BaseAuthority);

const BaseRelationship = require('../build/contracts/BaseRelationship.json');
const relationshipContract = contract(BaseRelationship);

const BaseIdentity = require('../build/contracts/BaseIdentity.json');
const identityContract = contract(BaseIdentity);

const IdentityAction = require('../build/contracts/IdentityAction.json');
const identityActionContract = contract(IdentityAction);

const privateKey = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709';
const privateKey2 = `0x748ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709`;

it('created relationship can be retrieved from identity by authority', async () => {
    const mask = "very-secure-mask-for-pii";

    accounts = await this.web3.eth.getAccounts();
    authorityContractInstance = await authorityContract.deployed();
    relationshipContractInstance = await relationshipContract.new(
        authorityContractInstance.contract.options.address,
        this.web3.utils.fromAscii(mask),
        this.web3.eth.accounts.privateKeyToAccount(privateKey).address,
        { from: accounts[1] }
    );

    identityContractInstance = await identityContract.new(
        [relationshipContractInstance.contract.options.address],
        { from: accounts[1] }
    );

    all = await identityContractInstance.relationshipsTo(
        authorityContractInstance.contract.options.address
    );
    expect(all.length).to.equal(1);

    actualRelationshipInstance = await relationshipContract.at(all[0]);
    actualMask = await actualRelationshipInstance.mask();
    expect(this.web3.utils.hexToUtf8(actualMask)).to.equal(mask);
});

it('able to register new relationship', async () => {
    accounts = await this.web3.eth.getAccounts();
    authorityContractInstance = await authorityContract.deployed();
    relationshipContractInstance = await relationshipContract.new(
        authorityContractInstance.contract.options.address,
        this.web3.utils.fromAscii("very-secure-mask-for-pii"),
        this.web3.eth.accounts.privateKeyToAccount(privateKey).address,
        { from: accounts[1] }
    );
    anotherRelationshipContractInstance = await relationshipContract.new(
        authorityContractInstance.contract.options.address,
        this.web3.utils.fromAscii("another-secure-mask-for-pii"),
        this.web3.eth.accounts.privateKeyToAccount(privateKey2).address,
        { from: accounts[1] }
    );

    identityContractInstance = await identityContract.new(
        [relationshipContractInstance.contract.options.address],
        { from: accounts[1] }
    );

    identityActionContractInstance = await identityActionContract.new(
        identityContractInstance.contract.options.address,
        0, // register
        anotherRelationshipContractInstance.contract.options.address,
        [],
        { from: accounts[1] }
    );

    sigObj = this.web3.eth.accounts.sign(this.web3.utils.keccak256(
        identityActionContractInstance.contract.options.address
    ), privateKey);

    tx = await identityContractInstance.handle(
        identityActionContractInstance.contract.options.address,
        relationshipContractInstance.contract.options.address,
        sigObj.v,
        sigObj.r,
        sigObj.s,
        { from: accounts[1] }
    );

    all = await identityContractInstance.relationshipsTo(
        authorityContractInstance.contract.options.address
    );
    expect(all.length).to.equal(2);
});
