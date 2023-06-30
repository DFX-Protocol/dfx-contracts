// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IYieldTracker} from "../tokens/YieldTracker.sol";

contract MockYieldTrackerEmitter is IYieldTracker {
	event Claim(address account, address receiver);
	event UpdateRewards(address account);

	function claim(address account, address receiver) external override returns (uint256) {
		emit Claim(account, receiver);
		return 0;
	}

	function updateRewards(address account) external override {
		emit UpdateRewards(account);
	}

	function getTokensPerInterval() external pure override returns (uint256) {
		return 0;
	}

	function claimable(address account) external pure override returns (uint256) {
		if (account != address(0)) {
			return 1;
		} else {
			return 0;
		}
	}
}
