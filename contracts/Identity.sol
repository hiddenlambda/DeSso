// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "./Authority.sol";
import "./Relationship.sol";
import "./IdentityAction.sol";

interface Identity {
    enum ActionKind {Register, UnRegister, RegisterAll, UnRegisterAll}

    function relationshipsTo(Authority auth)
        external
        view
        returns (Relationship[] memory);

    function isRelatedTo(Authority auth) external view returns (bool);

    function handle(
        IdentityAction action,
        Relationship accessor,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

contract BaseIdentity is Identity, RelationshipColl {
    // authority a => [r from relationships where r.authority() == a]
    mapping(address => Relationship[]) relationships;

    mapping(bytes32 => bool) relationshipSeen;

    constructor(Relationship[] memory _relationships) {
        registerAll(_relationships);
    }

    event Error(string _msg);

    modifier onlyWithAccess(
        IdentityAction action,
        Relationship accessor,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) {
        if (action.identity() != this) {
            emit Error("This action is for another identity");
        } else if (!has(accessor)) {
            emit Error("This accessor is not recognized");
        } else if (accessor.proofAddress() != recoverAddress(action, v, r, s)) {
            emit Error("This accessor does not match the signature. details");
        } else {
            _;
        }
    }

    function recoverAddress(
        IdentityAction action,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal pure returns (address) {
        bytes32 messageHash = keccak256(abi.encodePacked(address(action)));
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 hashed = keccak256(abi.encodePacked(prefix, messageHash));
        return ecrecover(hashed, v, r, s);
    }

    function handle(
        IdentityAction action,
        Relationship accessor,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override onlyWithAccess(action, accessor, v, r, s) {
        doAction(action);
    }

    function doAction(IdentityAction action) internal {
        if (action.kind() == ActionKind.Register) {
            register(action.relationship());
        } else if (action.kind() == ActionKind.UnRegister) {
            unregister(action.relationship());
        } else if (action.kind() == ActionKind.RegisterAll) {
            registerAll(action.relationshipBulk());
        } else if (action.kind() == ActionKind.UnRegisterAll) {
            unregisterAll(action.relationshipBulk());
        } else {
            revert();
        }
    }

    function register(Relationship relation) internal override {
        if (!has(relation)) {
            relationshipSeen[getHash(relation)] = true;
            relationships[address(relation.authority())].push(relation);
        }
    }

    function unregister(Relationship relation) internal override {
        if (has(relation)) {
            delete relationshipSeen[getHash(relation)];
            // I know this is scan and search and we usually should not
            // but for small, read-heavy data, this is quite sensible
            address authAddress = address(relation.authority());
            for (uint256 i = 0; i < relationships[authAddress].length; i++) {
                if (
                    getHash(relation) == getHash(relationships[authAddress][i])
                ) {
                    uint256 lastIndex = relationships[authAddress].length - 1;
                    relationships[authAddress][i] = relationships[authAddress][
                        lastIndex
                    ];
                    relationships[authAddress].pop();
                    break;
                }
            }
        }
    }

    function has(Relationship relation) public view returns (bool) {
        return relationshipSeen[getHash(relation)];
    }

    function relationshipsTo(Authority auth)
        external
        view
        override
        returns (Relationship[] memory)
    {
        return relationships[address(auth)];
    }

    function isRelatedTo(Authority auth) external view override returns (bool) {
        return relationships[address(auth)].length > 0;
    }
}
