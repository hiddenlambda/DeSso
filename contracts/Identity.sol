// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "./Authority.sol";
import "./Relationship.sol";
import "./IdentityAction.sol";

interface Identity {
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

    modifier onlyWithAccess(
        IdentityAction action,
        Relationship accessor,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) {
        require(action.identity() == this);
        require(has(accessor));

        bytes32 _hash = keccak256(abi.encode(address(action)));
        address withAccess = ecrecover(_hash, v, r, s);
        require(accessor.proofAddress() == withAccess);
        _;
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
                if (getHash(relation) == getHash(relationships[authAddress][i])) {
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
        if (action.isRegister()) {
            register(action.relationship());
        } else if (action.isUnRegister()) {
            unregister(action.relationship());
        } else if (action.isRegisterAll()) {
            registerAll(action.relationshipBulk());
        } else if (action.isUnRegisterAll()) {
            unregisterAll(action.relationshipBulk());
        } else {
            revert();
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
