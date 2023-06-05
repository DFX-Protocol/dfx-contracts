// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { YieldToken } from "./YieldToken.sol";

interface IUSDG {
    function addVault(address _vault) external;
    function removeVault(address _vault) external;
    function mint(address _account, uint256 _amount) external;
    function burn(address _account, uint256 _amount) external;
}

contract USDG is YieldToken, IUSDG {

    mapping (address => bool) public vaults;

    modifier onlyVault() {
        require(vaults[msg.sender], "USDG: forbidden");
        _;
    }

    constructor(address _vault) YieldToken("USD Gambit", "USDG", 0) {
        vaults[_vault] = true;
    }

    function addVault(address _vault) external override onlyGov {
        vaults[_vault] = true;
    }

    function removeVault(address _vault) external override onlyGov {
        vaults[_vault] = false;
    }

    function mint(address _account, uint256 _amount) external override onlyVault {
        _mint(_account, _amount);
    }

    function burn(address _account, uint256 _amount) external override onlyVault {
        _burn(_account, _amount);
    }
}
