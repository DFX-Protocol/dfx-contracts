// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MintableBaseToken } from "../tokens/MintableBaseToken.sol";

contract GLP is MintableBaseToken {
    constructor() MintableBaseToken("DFX LP", "GLP", 0) {
    }

    function id() external pure returns (string memory _name) {
        return "GLP";
    }
}
