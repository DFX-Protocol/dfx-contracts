// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MintableBaseToken} from "../tokens/MintableBaseToken.sol";

contract EsGMX is MintableBaseToken {
    constructor() MintableBaseToken("Escrowed GMX", "esGMX", 0) {
    }

    function id() external pure returns (string memory _name) {
        return "esGMX";
    }
}
