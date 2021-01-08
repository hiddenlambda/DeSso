// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.4;

import "./Identity.sol";
import "./Relationship.sol";

contract IdentityAction {
    enum ActionType {Register, UnRegister, RegisterAll, UnRegisterAll}

    ActionType actionType;

    Identity public identity;
    Relationship public relationship;
    Relationship[] _relationshipBulk;

    constructor(
        Identity _identity,
        ActionType _actionType,
        Relationship relation,
        Relationship[] memory realtionBulk
    ) {
        identity = _identity;
        actionType = _actionType;
        relationship = relation;
        _relationshipBulk = realtionBulk;
    }

    function relationshipBulk() external view returns (Relationship[] memory) {
        return _relationshipBulk;
    }

    function isRegister() external view returns (bool) {
        return actionType == ActionType.Register;
    }

    function isUnRegister() external view returns (bool) {
        return actionType == ActionType.UnRegister;
    }

    function isRegisterAll() external view returns (bool) {
        return actionType == ActionType.RegisterAll;
    }

    function isUnRegisterAll() external view returns (bool) {
        return actionType == ActionType.UnRegisterAll;
    }
}
