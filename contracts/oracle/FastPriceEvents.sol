// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Governable } from "../access/Governable.sol";

interface IFastPriceEvents {
    function emitPriceEvent(address _token, uint256 _price) external;
}

contract FastPriceEvents is IFastPriceEvents, Governable {

    mapping (address => bool) public isPriceFeed;
    event PriceUpdate(address token, uint256 price, address priceFeed);

    function setIsPriceFeed(address _priceFeed, bool _isPriceFeed) external onlyGov {
      isPriceFeed[_priceFeed] = _isPriceFeed;
    }

    function emitPriceEvent(address _token, uint256 _price) external override {
      require(isPriceFeed[msg.sender], "FastPriceEvents: invalid sender");
      emit PriceUpdate(_token, _price, msg.sender);
    }
}
