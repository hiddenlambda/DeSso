// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "./Identity.sol";
import "./Relationship.sol";

contract IdentityAction {
    Identity public identity;
    Identity.ActionKind public kind;
    Relationship public relationship;
    Relationship[] _relationshipBulk;

    constructor(
        Identity _identity,
        Identity.ActionKind _kind,
        Relationship relation,
        Relationship[] memory realtionBulk
    ) {
        identity = _identity;
        kind = _kind;
        relationship = relation;
        _relationshipBulk = realtionBulk;
    }

    function relationshipBulk() external view returns (Relationship[] memory) {
        return _relationshipBulk;
    }
}
