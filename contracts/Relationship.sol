// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "./Authority.sol";

interface Relationship {
    function authority() external view returns (Authority);
    function mask() external view returns (bytes32);
    function proofAddress() external view returns (address);
    function setProofAddress(address) external;
}

contract BaseRelationship is Relationship {
    Authority public override authority;
    bytes32 public override mask;
    address public override proofAddress;

    constructor(Authority _authority, bytes32 _mask, address _proofAddress) {
        require(_mask != bytes32(0));
        require(_proofAddress != address(0));

        authority = _authority;
        mask = _mask;
        proofAddress = _proofAddress;
    }

    modifier onlyAuthority(Authority auth) {
        require(msg.sender == auth.owner());
        _;
    }

    function setProofAddress(address _proofAddress) external override onlyAuthority(this.authority()) {
        proofAddress = _proofAddress;
    }
}

abstract contract RelationshipColl {
    function register(Relationship relation) internal virtual;
    function unregister(Relationship relation) internal virtual;
    function registerAll(Relationship[] memory relations) internal {
        for (uint i = 0; i < relations.length; i++) {
            register(relations[i]);
        }
    }

    function unregisterAll(Relationship[] memory relations) internal {
        for (uint i = 0; i < relations.length; i++) {
            unregister(relations[i]);
        }
    }

    function getHash(Relationship relation) internal view returns (bytes32) {
        return doHash(relation.mask(), address(relation.authority()));
    }

    function doHash(bytes32 mask, address authAddress) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(mask, authAddress));
    }
}
