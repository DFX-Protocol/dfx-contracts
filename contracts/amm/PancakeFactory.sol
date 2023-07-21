// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

interface IPancakeFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

contract PancakeFactory is IPancakeFactory {
    address public btc;
    address public bnb;
    address public busd;

    address public bnbBusdPair;
    address public btcBnbPair;

    constructor(address[] memory _addresses) {
        btc = _addresses[0];
        bnb = _addresses[1];
        busd = _addresses[2];

        bnbBusdPair = _addresses[3];
        btcBnbPair = _addresses[4];
    }

    function getPair(address tokenA, address tokenB) external override view returns (address) {
        if (tokenA == busd && tokenB == bnb) {
            return bnbBusdPair;
        }
        if (tokenA == bnb && tokenB == btc) {
            return btcBnbPair;
        }
        revert("Invalid tokens");
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'UniswapV2: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2: ZERO_ADDRESS');
        return token0;
    }
}
