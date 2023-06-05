// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IYieldToken_Original {
    function totalStaked() external view returns (uint256);
    function stakedBalance(address _account) external view returns (uint256);
    function removeAdmin(address _account) external;
}
