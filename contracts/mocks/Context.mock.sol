// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Context } from "../libraries/utils/Context.sol";

interface IContextMock
{
	function mockMsgData2(address one, uint256 two, uint32 three) external returns (bytes calldata);
	function mockMsgData() external view returns (bytes calldata);
	function mockMsgSender() external view returns (address);
}

contract ContextMock is Context, IContextMock
{
	constructor()
	{} // solhint-disable-line no-empty-blocks

	function mockMsgData() override public view returns (bytes calldata)
	{
		return Context._msgData();
	}

	function mockMsgData2(address one, uint256 two, uint32 three) override public view returns (bytes calldata)
	{
		require(one != address(0), "Mocktest");
		require(two > 0, "Mocktest");
		require(three > 0, "Mocktest");
		return Context._msgData();
	}

	function mockMsgSender() override public view returns (address)
	{
		return Context._msgSender();
	}
}