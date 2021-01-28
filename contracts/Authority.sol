// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "./Relationship.sol";

interface Authority {
    // to identify message sender in callback
    function owner() external view returns (address);

    function seekApproval(Relationship relationship) external;
}

contract BaseAuthority is Authority {
    address public override owner;

    constructor() {
        owner = msg.sender;
    }

    event NewRequest(Relationship relationship);

    function seekApproval(Relationship relationship) external override {
        emit NewRequest(relationship);
    }
}
