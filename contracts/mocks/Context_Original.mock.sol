// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "../compare/libraries/GSN/Context.sol";

interface IContextMock_Original
{
	function mockMsgData2(address one, uint256 two, uint32 three) external view returns (bytes memory);
	function mockMsgData() external view returns (bytes calldata);
	function mockMsgSender() external view returns (address);
}

contract ContextMock_Original is Context_Original, IContextMock_Original
{
	constructor() public
	{} // solhint-disable-line no-empty-blocks

	function mockMsgData() override public view returns (bytes memory)
	{
		return Context_Original._msgData();
	}

	function mockMsgData2(address one, uint256 two, uint32 three) override public view returns (bytes memory)
	{
		require(one != address(0), "Mocktest");
		require(two > 0, "Mocktest");
		require(three > 0, "Mocktest");
		return Context_Original._msgData();
	}

	function mockMsgSender() override public view returns (address)
	{
		return Context_Original._msgSender();
	}
}