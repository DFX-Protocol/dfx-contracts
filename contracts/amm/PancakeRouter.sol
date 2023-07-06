// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../tokens/MintableBaseToken.sol";

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
	function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

interface IPancakeRouter {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
}


contract PancakeRouter is IPancakeRouter {
    address public pair;

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 /*amountAMin*/,
        uint256 /*amountBMin*/,
        address to,
        uint256 deadline
    ) external override returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        require(deadline >= block.timestamp, 'PancakeRouter: EXPIRED');

        MintableBaseToken(pair).mint(to, 1000);

        IERC20(tokenA).transferFrom(msg.sender, pair, amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountBDesired);

        amountA = amountADesired;
        amountB = amountBDesired;
        liquidity = 1000;
    }
}
