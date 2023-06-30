// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AmountExceedsBalance, ERC20, IERC20, IERC20Metadata, IERC20AltApprove, InvalidAddress} from "../libraries/token/ERC20.sol";
import {SafeERC20} from "../libraries/token/SafeERC20.sol";

import {Governable, IGovernable, PermissionDenied} from "../access/Governable.sol";
import {IYieldTracker} from "./YieldTracker.sol";

error NonStakingAccountAlreadyMarked(address account);
error NonStakingAccountNotMarked(address account);
error SenderNotWhitelisted(address spender);

interface IBaseToken is IGovernable, IERC20AltApprove, IERC20Metadata {
	function addAdmin(address account) external;

	function addNonStakingAccount(address account) external;

	function claim(address receiver) external;

	function recoverClaim(address account, address receiver) external;

	function removeAdmin(address account) external;

	function removeNonStakingAccount(address account) external;

	function setHandler(address handler, bool isActive) external;

	function setInfo(string memory name, string memory symbol) external;

	function setInPrivateTransferMode(bool isActive) external;

	function setYieldTrackers(IYieldTracker[] memory yieldTrackers) external;

	function withdrawToken(address token, address account, uint256 amount) external;

	function admins(address account) external view returns (bool);

	function isHandler(address account) external view returns (bool);

	function inPrivateTransferMode() external view returns (bool);

	function nonStakingAccounts(address account) external view returns (bool);

	function nonStakingSupply() external view returns (uint256);

	function stakedBalance(address _account) external view returns (uint256);

	function totalStaked() external view returns (uint256);

	function yieldTrackers(uint256 index) external view returns (IYieldTracker);
}

contract BaseToken is ERC20, Governable, IBaseToken {
	using SafeERC20 for IERC20Metadata;

	uint256 internal _nonStakingSupply;
	IYieldTracker[] internal _yieldTrackers;
	bool internal _inPrivateTransferMode;
	mapping(address => bool) internal _nonStakingAccounts;
	mapping(address => bool) internal _admins;
	mapping(address => bool) internal _isHandler;

	modifier onlyAdmin() {
		address sender = _msgSender();
		if (!_admins[sender]) revert PermissionDenied(sender, "onlyAdmin");
		_;
	}

	constructor(string memory _name, string memory _symbol, uint256 _initialSupply) ERC20(_name, _symbol) {
		_mint(_msgSender(), _initialSupply);
	}

	function addAdmin(address account) external override onlyGov {
		_admins[account] = true;
	}

	function addNonStakingAccount(address account) external override onlyAdmin {
		if (_nonStakingAccounts[account]) revert NonStakingAccountAlreadyMarked(account);
		_updateRewards(account);
		_nonStakingAccounts[account] = true;
		unchecked {
			// Can not be greater than totalSupply and therefore not overflow.
			_nonStakingSupply = _nonStakingSupply + (_balances[account]);
		}
	}

	function claim(address receiver) external override {
		unchecked {
			// i can not overflow
			for (uint256 i = 0; i < _yieldTrackers.length; i++) {
				IYieldTracker yieldTracker = _yieldTrackers[i];
				yieldTracker.claim(_msgSender(), receiver);
			}
		}
	}

	function recoverClaim(address account, address receiver) external override onlyAdmin {
		unchecked {
			// i can not overflow
			for (uint256 i = 0; i < _yieldTrackers.length; i++) {
				IYieldTracker yieldTracker = _yieldTrackers[i];
				yieldTracker.claim(account, receiver);
			}
		}
	}

	function removeAdmin(address account) external override onlyGov {
		_admins[account] = false;
	}

	function removeNonStakingAccount(address account) external override onlyAdmin {
		if (!_nonStakingAccounts[account]) revert NonStakingAccountNotMarked(account);
		_updateRewards(account);
		_nonStakingAccounts[account] = false;
		unchecked {
			// Can not underflow because _nonStakingSupply is at least _balances[account]
			_nonStakingSupply = _nonStakingSupply - (_balances[account]);
		}
	}

	function setHandler(address handler, bool isActive) external override onlyGov {
		_isHandler[handler] = isActive;
	}

	function setInfo(string memory name, string memory symbol) external override onlyGov {
		_name = name;
		_symbol = symbol;
	}

	function setInPrivateTransferMode(bool isActive) external override onlyGov {
		_inPrivateTransferMode = isActive;
	}

	function setYieldTrackers(IYieldTracker[] memory yieldTrackerArray) external override onlyGov {
		_yieldTrackers = yieldTrackerArray;
	}

	function transferFrom(address from, address to, uint256 amount) external override(ERC20, IERC20) returns (bool) {
		address sender = _msgSender();
		if (!_isHandler[sender]) {
			_spendAllowance(from, sender, amount);
		}
		_transfer(from, to, amount);
		return true;
	}

	function withdrawToken(address token, address account, uint256 amount) external override onlyGov {
		// to help users who accidentally send their tokens to this contract
		IERC20Metadata(token).safeTransfer(account, amount);
	}

	function admins(address account) external view override returns (bool) {
		return _admins[account];
	}

	function isHandler(address account) external view returns (bool) {
		return _isHandler[account];
	}

	function inPrivateTransferMode() external view returns (bool) {
		return _inPrivateTransferMode;
	}

	function nonStakingAccounts(address account) external view returns (bool) {
		return _nonStakingAccounts[account];
	}

	function nonStakingSupply() external view returns (uint256) {
		return _nonStakingSupply;
	}

	function stakedBalance(address account) external view override returns (uint256) {
		if (_nonStakingAccounts[account]) {
			return 0;
		}
		return _balances[account];
	}

	function totalStaked() external view override returns (uint256) {
		unchecked {
			return _totalSupply - _nonStakingSupply;
		}
	}

	function yieldTrackers(uint256 index) external view override returns (IYieldTracker) {
		return _yieldTrackers[index];
	}

	function _burn(address account, uint256 amount) internal virtual override {
		if (account == address(0)) revert InvalidAddress(account, "Can not burn from zero address.");

		_updateRewards(account);

		uint256 accountBalance = _balances[account];
		if (accountBalance < amount) revert AmountExceedsBalance(account, accountBalance, amount);
		unchecked {
			_balances[account] = accountBalance - amount;
			_totalSupply -= amount;
			if (_nonStakingAccounts[account]) {
				_nonStakingSupply -= amount;
			}
		}

		emit Transfer(account, address(0), amount);
	}

	function _mint(address account, uint256 amount) internal virtual override {
		if (account == address(0)) revert InvalidAddress(account, "Can not mint to zero address.");

		_updateRewards(account);

		_totalSupply += amount;
		unchecked {
			// if _totalSupply did not overflow this can't overflow too.
			_balances[account] += amount;

			if (_nonStakingAccounts[account]) {
				_nonStakingSupply += amount;
			}
		}

		emit Transfer(address(0), account, amount);
	}

	function _transfer(address from, address to, uint256 amount) internal virtual override {
		if (from == address(0)) revert InvalidAddress(from, "Can not transfer from zero address.");
		if (to == address(0)) revert InvalidAddress(to, "Can not transfer to zero address.");

		address sender = _msgSender();
		if (_inPrivateTransferMode) {
			if (!_isHandler[sender]) revert SenderNotWhitelisted(sender);
		}

		uint256 fromBalance = _balances[from];
		if (fromBalance < amount) revert AmountExceedsBalance(from, fromBalance, amount);
		unchecked {
			_balances[from] = fromBalance - amount;
			_balances[to] += amount;

			_updateRewards(from);
			_updateRewards(to);

			if (_nonStakingAccounts[from]) {
				_nonStakingSupply -= amount;
			}

			if (_nonStakingAccounts[to]) {
				_nonStakingSupply += amount;
			}
		}

		emit Transfer(from, to, amount);
	}

	function _updateRewards(address account) private {
		unchecked {
			// i can not overflow
			for (uint256 i = 0; i < _yieldTrackers.length; i++) {
				IYieldTracker yieldTracker = _yieldTrackers[i];
				yieldTracker.updateRewards(account);
			}
		}
	}
}
