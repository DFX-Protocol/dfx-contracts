// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20, IERC20Metadata, IERC20AltApprove } from "../libraries/token/ERC20.sol";

interface IERC20Mock is IERC20AltApprove, IERC20Metadata
{
	function mockMint(address to, uint256 amount) external;
	function mockBurn(address account, uint256 amount) external;
	function mockApproveFromZeroAddress(address account, uint256 amount) external;
	function mockTransferFromZeroAddress(address to, uint256 amount) external;
}

contract ERC20Mock is ERC20, IERC20Mock
{
	constructor(string memory name, string memory symbol) ERC20(name, symbol)
	{} // solhint-disable-line no-empty-blocks

	function mockMint(address to, uint256 amount) override public
	{
		_mint(to, amount);
	}

	function mockBurn(address account, uint256 amount) override public
	{
		_burn(account, amount);
	}

	function mockApproveFromZeroAddress(address spender, uint256 amount) override public
	{
		_approve(address(0), spender, amount);
	}

	function mockTransferFromZeroAddress(address to, uint256 amount) override public
	{
		_transfer(address(0), to, amount);
		
	}
}