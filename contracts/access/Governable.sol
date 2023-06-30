// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

error PermissionDenied(address violator, string check);

interface IGovernable
{
    function setGov(address _gov) external;

    function gov() external view returns(address);
}

abstract contract Governable is IGovernable
{
    address public gov;

    constructor() {
        gov = msg.sender;
    }

    modifier onlyGov()
    {
        if(msg.sender != gov) revert PermissionDenied(msg.sender, "onlyGov");
        _;
    }

    function setGov(address _gov) external onlyGov {
        gov = _gov;
    }
}
