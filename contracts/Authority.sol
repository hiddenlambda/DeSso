// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "./Identity.sol";

interface Authority is Identity {
    // to identify message sender in callback
    function owner() external view returns (address);

    function seekApproval(Relationship relationship) external;
}

contract BaseAuthority is BaseIdentity, Authority {
    address public override owner;

    constructor() BaseIdentity() {
        owner = msg.sender;
    }

    event NewRequest(Relationship relationship);

    function seekApproval(Relationship relationship) external override {
        emit NewRequest(relationship);
    }
}
