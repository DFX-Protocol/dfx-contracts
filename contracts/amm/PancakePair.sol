// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPancakePair
{
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
	function token0() external view returns (address);
	function token1() external view returns (address);
}

contract PancakePair is IPancakePair
{
    uint112 private reserve0;           // uses single storage slot, accessible via getReserves
    uint112 private reserve1;           // uses single storage slot, accessible via getReserves
    uint32  private blockTimestampLast; // uses single storage slot, accessible via getReserves
	address private _token0;
	address private _token1;

    function setReserves(uint256 balance0, uint256 balance1) external {
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = uint32(block.timestamp);
    }

    function getReserves() public override view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

	function token0() override public view returns (address)
	{
		return _token0;
	}
	
	function token1() override public view returns (address)
	{
		return _token1;
	}
}
