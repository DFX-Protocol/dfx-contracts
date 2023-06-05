// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

error AccessForbidden(address violator, string check, string reason);

contract Governable
{
    address public gov;

    constructor() {
        gov = msg.sender;
    }

    modifier onlyGov()
    {
        if(msg.sender != gov) revert AccessForbidden(msg.sender, "Governable", "No permission.");
        _;
    }

    function setGov(address _gov) external onlyGov {
        gov = _gov;
    }
}
