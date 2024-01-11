// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MintableBaseToken} from "../tokens/MintableBaseToken.sol";

contract DFX is MintableBaseToken {
    constructor() MintableBaseToken("DFX", "DFX", 0) {
    }

    function id() external pure returns (string memory _name) {
        return "DFX";
    }
}
