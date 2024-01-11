// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MintableBaseToken} from "../tokens/MintableBaseToken.sol";

contract EsDFX is MintableBaseToken {
    constructor() MintableBaseToken("Escrowed DFX", "esDFX", 0) {
    }

    function id() external pure returns (string memory _name) {
        return "esDFX";
    }
}
