// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "../compare/libraries/token/ERC20.sol";
import "../compare/libraries/token/IERC20.sol";

interface IERC20Mock_Original is IERC20_Original
{
	function mockMint(address to, uint256 amount) external;
	function mockBurn(address account, uint256 amount) external;
	function mockApproveFromZeroAddress(address account, uint256 amount) external;
	function mockTransferFromZeroAddress(address to, uint256 amount) external;
}

contract ERC20Mock_Original is ERC20_Original, IERC20Mock_Original
{
	constructor(string memory name, string memory symbol) ERC20_Original(name, symbol) public
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