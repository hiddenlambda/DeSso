const contract = require('@truffle/contract');
const { expect } = require('chai');

const web3 = require('../commons/web3');

const BaseAuthority = require('../build/contracts/BaseAuthority.json');
const authorityContract = contract(BaseAuthority);

const BaseRelationship = require('../build/contracts/BaseRelationship.json');
const relationshipContract = contract(BaseRelationship);

const BaseIdentity = require('../build/contracts/BaseIdentity.json');
const identityContract = contract(BaseIdentity);

const IdentityAction = require('../build/contracts/IdentityAction.json');
const identityActionContract = contract(IdentityAction);

authorityContract.setProvider(web3.currentProvider);
relationshipContract.setProvider(web3.currentProvider);
identityContract.setProvider(web3.currentProvider);
identityActionContract.setProvider(web3.currentProvider);

const Mask = "very-secure-mask-for-pii";
const Mask2 = "another-secure-mask-for-pii";

const PrivateKey = '0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709';
const PrivateKey2 = `0x748ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709`;

after(() => {
    web3.currentProvider.connection.close();
});

function cast(instance) {
    return instance.contract.options.address;
}

function chooseRandom(choices) {
    return choices[Math.floor(Math.random() * choices.length)];
}

async function getRandomAccount() {
    accounts = await web3.eth.getAccounts();
    return chooseRandom(accounts);
}

function accountFor(privateKey) {
    return web3.eth.accounts.privateKeyToAccount(privateKey).address;
}

function toBytes(str) {
    return web3.utils.fromAscii(str);
}

async function createRelationship(authority, mask, privateKey) {
    return await relationshipContract.new(
        cast(authority),
        toBytes(mask),
        accountFor(privateKey),
        { from: await getRandomAccount() }
    );
}

async function createManyRelationships(details) {
    authority = await authorityContract.deployed();
    return await Promise.all(details.map(async ({ mask, key }) => {
        return await createRelationship(authority, mask, key);
    }));
}

async function createIdentity(relationships) {
    return await identityContract.new(
        relationships.map(cast),
        { from: await getRandomAccount() }
    );
}

async function createIdentityAction(identity, action, relationship) {
    return await identityActionContract.new(
        cast(identity), action, cast(relationship), [],
        { from: await getRandomAccount() }
    );
}

async function createIdentityBulkAction(identity, action, relationships) {
    return await identityActionContract.new(
        cast(identity), action, null, relationships.map(cast),
        { from: await getRandomAccount() }
    );
}

function signIdentityAction(identityAction, privateKey) {
    return web3.eth.accounts.sign(
        web3.utils.keccak256(cast(identityAction)),
        privateKey
    );
}

async function handleAction(identity, identityAction, proofRelationship, sigObj) {
    await identity.handle(
        cast(identityAction),
        cast(proofRelationship),
        sigObj.v, sigObj.r, sigObj.s,
        { from: await getRandomAccount() }
    );
}

async function expectMask(relationship, mask) {
    actualMask = await relationship.mask();
    expect(web3.utils.hexToUtf8(actualMask)).to.equal(mask);
}

async function expectAllMasks(relationships, masks) {
    expect(allRelationships.length).to.equal(masks.length);
    await Promise.all(relationships.map(async (relation, i) => {
        actualRelation = await relationshipContract.at(relation);
        await expectMask(actualRelation, masks[i]);
    }));
}

describe('created relationships can be retrieved from identity by authority', async () => {
    testRoundTrip = (relationshipDetails, masks) => async () => {
        authority = await authorityContract.deployed();

        relationships = await createManyRelationships(relationshipDetails);
        identity = await createIdentity(relationships);

        expect(relationships.length).to.equal(relationshipDetails.length);

        allRelationships = await identity.relationshipsTo(cast(authority));
        await expectAllMasks(allRelationships, masks);
    }
    positiveCases = [
        [{
            mask: Mask,
            key: PrivateKey
        }],
        [{
            mask: Mask2,
            key: PrivateKey2
        }],
        [
            {
                mask: Mask,
                key: PrivateKey
            },
            {
                mask: Mask2,
                key: PrivateKey2
            },
        ]
    ];
    positiveCases.map(async (c) => {
        it("all unique relationships are retained", testRoundTrip(c, c.map(o => o.mask)));
    });

    negativeCases = [
        {
            input: [
                {
                    mask: Mask,
                    key: PrivateKey
                },
                {
                    mask: Mask,
                    key: PrivateKey2
                },
            ],
            output: [
                Mask
            ]
        },
        {
            input: [
                {
                    mask: Mask,
                    key: PrivateKey
                },
                {
                    mask: Mask,
                    key: PrivateKey2
                },
                {
                    mask: Mask2,
                    key: PrivateKey2
                }
            ],
            output: [
                Mask,
                Mask2
            ]
        },
        {
            input: [
                {
                    mask: Mask,
                    key: PrivateKey
                },
                {
                    mask: Mask2,
                    key: PrivateKey2
                },
                {
                    mask: Mask,
                    key: PrivateKey2
                }
            ],
            output: [
                Mask,
                Mask2
            ]
        }
    ];
    negativeCases.map(async (c) => {
        it("duplicates are dropped", testRoundTrip(c.input, c.output));
    });
});

describe('able to register new relationship with correct credentials only', async () => {
    testRegister = (details, idStartIndex, actionIndex, proofIndex, proofKey, masks) => {
        return async () => {
            authority = await authorityContract.deployed();

            relationships = await createManyRelationships(details);
            expect(relationships.length).to.equal(details.length);

            identity = await createIdentity(relationships.slice(idStartIndex));
            identityAction = await createIdentityAction(identity, 0, relationships[actionIndex]);
            sigObj = signIdentityAction(identityAction, proofKey);
            tx = await handleAction(identity, identityAction, relationships[proofIndex], sigObj);

            allRelationships = await identity.relationshipsTo(cast(authority));
            await expectAllMasks(allRelationships, masks);
        }
    }

    negativeCases = [{
        title: "Unregistered proof relationship",
        relationshipDetails: [{
            mask: Mask,
            key: PrivateKey
        }, {
            mask: Mask2,
            key: PrivateKey2
        }],
        identityPartitionIndex: 1,
        actionRelationshipIndex: 0,
        proofRelationshipIndex: 0,
        proofKey: PrivateKey,
        masks: [Mask2]
    },
    {
        title: "Unregistered proof relationship with correct private key",
        relationshipDetails: [{
            mask: Mask,
            key: PrivateKey
        }, {
            mask: Mask2,
            key: PrivateKey2
        }],
        identityPartitionIndex: 1,
        actionRelationshipIndex: 0,
        proofRelationshipIndex: 0,
        proofKey: PrivateKey2,
        masks: [Mask2]
    },
    {
        title: "Incorrect private key",
        relationshipDetails: [{
            mask: Mask,
            key: PrivateKey
        }, {
            mask: Mask2,
            key: PrivateKey2
        }],
        identityPartitionIndex: 1,
        actionRelationshipIndex: 0,
        proofRelationshipIndex: 1,
        proofKey: PrivateKey,
        masks: [Mask2]
    }];
    negativeCases.map(async (c) => {
        it("bad credentials - ".concat(c.title), testRegister(
            c.relationshipDetails,
            c.identityPartitionIndex,
            c.actionRelationshipIndex,
            c.proofRelationshipIndex,
            c.proofKey,
            c.masks
        ));
    });
    positiveCases = [{
        title: "Registered proof relationship and matching private key",
        relationshipDetails: [{
            mask: Mask,
            key: PrivateKey
        }, {
            mask: Mask2,
            key: PrivateKey2
        }],
        identityPartitionIndex: 1,
        actionRelationshipIndex: 0,
        proofRelationshipIndex: 1,
        proofKey: PrivateKey2,
        masks: [Mask2, Mask]
    }];
    positiveCases.map(async (c) => {
        it("good credentials - ".concat(c.title), testRegister(
            c.relationshipDetails,
            c.identityPartitionIndex,
            c.actionRelationshipIndex,
            c.proofRelationshipIndex,
            c.proofKey,
            c.masks
        ));
    });
});
