// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../libraries/token/ERC20.sol";
import {SafeERC20} from "../libraries/token/SafeERC20.sol";
import {ReentrancyGuard} from "../libraries/utils/ReentrancyGuard.sol";
import {Address} from "../libraries/utils/Address.sol";

import {IRewardTracker} from "./RewardTracker.sol";
import {IVester} from "./Vester.sol";
import {IMintable} from "../tokens/MintableBaseToken.sol";
import {IWETH} from "../tokens/WETH.sol";
import {IDlpManager} from "../core/DlpManager.sol";
import {Governable} from "../access/Governable.sol";

struct Vesters {
	address dfx;
	address dlp;
}

struct Trackers {
	address stakedDfxTracker;
	address stakedDlpTracker;
	address feeDfxTracker;
	address feeDlpTracker;
	address bonusDfxTracker;
}

interface IRewardRouterV2 {
	function feeDlpTracker() external view returns (address);

	function stakedDlpTracker() external view returns (address);
}

contract RewardRouterV2 is IRewardRouterV2, ReentrancyGuard, Governable {
	using SafeERC20 for IERC20;
	using Address for address payable;

	bool public isInitialized;

	address public immutable weth;

	address public dfx;
	address public esDfx;
	address public bnDfx;

	address public dlp; // DFX Liquidity Provider token

	address public stakedDfxTracker;
	address public bonusDfxTracker;
	address public feeDfxTracker;

	address public override stakedDlpTracker;
	address public override feeDlpTracker;

	address public dlpManager;

	address public dfxVester;
	address public dlpVester;

	mapping(address => address) public pendingReceivers;

	event StakeDfx(address account, address token, uint256 amount);
	event UnstakeDfx(address account, address token, uint256 amount);

	event StakeDlp(address account, uint256 amount);
	event UnstakeDlp(address account, uint256 amount);

	receive() external payable {
		require(msg.sender == weth, "Router: invalid sender");
	}

	constructor(address _weth) {
		weth = _weth;
	}

	function initialize(
		address dfx_,
		address _esDfx,
		address _bnDfx,
		address _dlp,
		address _dlpManager,
		Trackers memory _trackers,
		Vesters memory _vesters
	) external onlyGov {
		require(!isInitialized, "RewardRouter: already initialized");
		isInitialized = true;

		dfx = dfx_;
		esDfx = _esDfx;
		bnDfx = _bnDfx;

		dlp = _dlp;

		stakedDfxTracker = _trackers.stakedDfxTracker;
		bonusDfxTracker = _trackers.bonusDfxTracker;
		feeDfxTracker = _trackers.feeDfxTracker;

		feeDlpTracker = _trackers.feeDlpTracker;
		stakedDlpTracker = _trackers.stakedDlpTracker;

		dlpManager = _dlpManager;

		dfxVester = _vesters.dfx;
		dlpVester = _vesters.dlp;
	}

	// to help users who accidentally send their tokens to this contract
	function withdrawToken(address _token, address _account, uint256 _amount) external onlyGov {
		IERC20(_token).safeTransfer(_account, _amount);
	}

	function batchStakeDfxForAccount(address[] memory _accounts, uint256[] memory _amounts) external nonReentrant onlyGov {
		address _dfx = dfx;
		for (uint256 i = 0; i < _accounts.length; i++) {
			_stakeDfx(msg.sender, _accounts[i], _dfx, _amounts[i]);
		}
	}

	function stakeDfxForAccount(address _account, uint256 _amount) external nonReentrant onlyGov {
		_stakeDfx(msg.sender, _account, dfx, _amount);
	}

	function stakeDfx(uint256 _amount) external nonReentrant {
		_stakeDfx(msg.sender, msg.sender, dfx, _amount);
	}

	function stakeEsDfx(uint256 _amount) external nonReentrant {
		_stakeDfx(msg.sender, msg.sender, esDfx, _amount);
	}

	function unstakeDfx(uint256 _amount) external nonReentrant {
		_unstakeDfx(msg.sender, dfx, _amount, true);
	}

	function unstakeEsDfx(uint256 _amount) external nonReentrant {
		_unstakeDfx(msg.sender, esDfx, _amount, true);
	}

	function mintAndStakeDlp(address _token, uint256 _amount, uint256 _minUsdg, uint256 _minDlp) external nonReentrant returns (uint256) {
		require(_amount > 0, "RewardRouter: invalid _amount");

		address account = msg.sender;
		uint256 dlpAmount = IDlpManager(dlpManager).addLiquidityForAccount(account, account, _token, _amount, _minUsdg, _minDlp);
		IRewardTracker(feeDlpTracker).stakeForAccount(account, account, dlp, dlpAmount);
		IRewardTracker(stakedDlpTracker).stakeForAccount(account, account, feeDlpTracker, dlpAmount);

		emit StakeDlp(account, dlpAmount);

		return dlpAmount;
	}

	function mintAndStakeDlpETH(uint256 _minUsdg, uint256 _minDlp) external payable nonReentrant returns (uint256) {
		require(msg.value > 0, "RewardRouter: invalid msg.value");

		IWETH(weth).deposit{value: msg.value}();
		IERC20(weth).approve(dlpManager, msg.value);

		address account = msg.sender;
		uint256 dlpAmount = IDlpManager(dlpManager).addLiquidityForAccount(address(this), account, weth, msg.value, _minUsdg, _minDlp);

		IRewardTracker(feeDlpTracker).stakeForAccount(account, account, dlp, dlpAmount);
		IRewardTracker(stakedDlpTracker).stakeForAccount(account, account, feeDlpTracker, dlpAmount);

		emit StakeDlp(account, dlpAmount);

		return dlpAmount;
	}

	function unstakeAndRedeemDlp(address _tokenOut, uint256 _dlpAmount, uint256 _minOut, address _receiver) external nonReentrant returns (uint256) {
		require(_dlpAmount > 0, "RewardRouter: invalid _dlpAmount");

		address account = msg.sender;
		IRewardTracker(stakedDlpTracker).unstakeForAccount(account, feeDlpTracker, _dlpAmount, account);
		IRewardTracker(feeDlpTracker).unstakeForAccount(account, dlp, _dlpAmount, account);
		uint256 amountOut = IDlpManager(dlpManager).removeLiquidityForAccount(account, _tokenOut, _dlpAmount, _minOut, _receiver);

		emit UnstakeDlp(account, _dlpAmount);

		return amountOut;
	}

	function unstakeAndRedeemDlpETH(uint256 _dlpAmount, uint256 _minOut, address payable _receiver) external nonReentrant returns (uint256) {
		require(_dlpAmount > 0, "RewardRouter: invalid _dlpAmount");

		address account = msg.sender;
		IRewardTracker(stakedDlpTracker).unstakeForAccount(account, feeDlpTracker, _dlpAmount, account);
		IRewardTracker(feeDlpTracker).unstakeForAccount(account, dlp, _dlpAmount, account);
		uint256 amountOut = IDlpManager(dlpManager).removeLiquidityForAccount(account, weth, _dlpAmount, _minOut, address(this));

		IWETH(weth).withdraw(amountOut);

		_receiver.sendValue(amountOut);

		emit UnstakeDlp(account, _dlpAmount);

		return amountOut;
	}

	function claim() external nonReentrant {
		address account = msg.sender;

		IRewardTracker(feeDfxTracker).claimForAccount(account, account);
		IRewardTracker(feeDlpTracker).claimForAccount(account, account);

		IRewardTracker(stakedDfxTracker).claimForAccount(account, account);
		IRewardTracker(stakedDlpTracker).claimForAccount(account, account);
	}

	function claimEsDfx() external nonReentrant {
		address account = msg.sender;

		IRewardTracker(stakedDfxTracker).claimForAccount(account, account);
		IRewardTracker(stakedDlpTracker).claimForAccount(account, account);
	}

	function claimFees() external nonReentrant {
		address account = msg.sender;

		IRewardTracker(feeDfxTracker).claimForAccount(account, account);
		IRewardTracker(feeDlpTracker).claimForAccount(account, account);
	}

	function compound() external nonReentrant {
		_compound(msg.sender);
	}

	function compoundForAccount(address _account) external nonReentrant onlyGov {
		_compound(_account);
	}

	function handleRewards(
		bool _shouldClaimDfx,
		bool _shouldStakeDfx,
		bool _shouldClaimEsDfx,
		bool _shouldStakeEsDfx,
		bool _shouldStakeMultiplierPoints,
		bool _shouldClaimWeth,
		bool _shouldConvertWethToEth
	) external nonReentrant {
		address account = msg.sender;

		uint256 dfxAmount = 0;
		if (_shouldClaimDfx) {
			uint256 dfxAmount0 = IVester(dfxVester).claimForAccount(account, account);
			uint256 dfxAmount1 = IVester(dlpVester).claimForAccount(account, account);
			dfxAmount = dfxAmount0 + (dfxAmount1);
		}

		if (_shouldStakeDfx && dfxAmount > 0) {
			_stakeDfx(account, account, dfx, dfxAmount);
		}

		uint256 esDfxAmount = 0;
		if (_shouldClaimEsDfx) {
			uint256 esDfxAmount0 = IRewardTracker(stakedDfxTracker).claimForAccount(account, account);
			uint256 esDfxAmount1 = IRewardTracker(stakedDlpTracker).claimForAccount(account, account);
			esDfxAmount = esDfxAmount0 + (esDfxAmount1);
		}

		if (_shouldStakeEsDfx && esDfxAmount > 0) {
			_stakeDfx(account, account, esDfx, esDfxAmount);
		}

		if (_shouldStakeMultiplierPoints) {
			uint256 bnDfxAmount = IRewardTracker(bonusDfxTracker).claimForAccount(account, account);
			if (bnDfxAmount > 0) {
				IRewardTracker(feeDfxTracker).stakeForAccount(account, account, bnDfx, bnDfxAmount);
			}
		}

		if (_shouldClaimWeth) {
			if (_shouldConvertWethToEth) {
				uint256 weth0 = IRewardTracker(feeDfxTracker).claimForAccount(account, address(this));
				uint256 weth1 = IRewardTracker(feeDlpTracker).claimForAccount(account, address(this));

				uint256 wethAmount = weth0 + (weth1);
				IWETH(weth).withdraw(wethAmount);

				payable(account).sendValue(wethAmount);
			} else {
				IRewardTracker(feeDfxTracker).claimForAccount(account, account);
				IRewardTracker(feeDlpTracker).claimForAccount(account, account);
			}
		}
	}

	function batchCompoundForAccounts(address[] memory _accounts) external nonReentrant onlyGov {
		for (uint256 i = 0; i < _accounts.length; i++) {
			_compound(_accounts[i]);
		}
	}

	// the _validateReceiver function checks that the averageStakedAmounts and cumulativeRewards
	// values of an account are zero, this is to help ensure that vesting calculations can be
	// done correctly
	// averageStakedAmounts and cumulativeRewards are updated if the claimable reward for an account
	// is more than zero
	// it is possible for multiple transfers to be sent into a single account, using signalTransfer and
	// acceptTransfer, if those values have not been updated yet
	// for DLP transfers it is also possible to transfer DLP into an account using the StakedDlp contract
	function signalTransfer(address _receiver) external nonReentrant {
		require(IERC20(dfxVester).balanceOf(msg.sender) == 0, "RewardRouter: sender has vested tokens");
		require(IERC20(dlpVester).balanceOf(msg.sender) == 0, "RewardRouter: sender has vested tokens");

		_validateReceiver(_receiver);
		pendingReceivers[msg.sender] = _receiver;
	}

	function acceptTransfer(address _sender) external nonReentrant {
		require(IERC20(dfxVester).balanceOf(_sender) == 0, "RewardRouter: sender has vested tokens");
		require(IERC20(dlpVester).balanceOf(_sender) == 0, "RewardRouter: sender has vested tokens");

		address receiver = msg.sender;
		require(pendingReceivers[_sender] == receiver, "RewardRouter: transfer not signalled");
		delete pendingReceivers[_sender];

		_validateReceiver(receiver);
		_compound(_sender);

		uint256 stakedDfx = IRewardTracker(stakedDfxTracker).depositBalances(_sender, dfx);
		if (stakedDfx > 0) {
			_unstakeDfx(_sender, dfx, stakedDfx, false);
			_stakeDfx(_sender, receiver, dfx, stakedDfx);
		}

		uint256 stakedEsDfx = IRewardTracker(stakedDfxTracker).depositBalances(_sender, esDfx);
		if (stakedEsDfx > 0) {
			_unstakeDfx(_sender, esDfx, stakedEsDfx, false);
			_stakeDfx(_sender, receiver, esDfx, stakedEsDfx);
		}

		uint256 stakedBnDfx = IRewardTracker(feeDfxTracker).depositBalances(_sender, bnDfx);
		if (stakedBnDfx > 0) {
			IRewardTracker(feeDfxTracker).unstakeForAccount(_sender, bnDfx, stakedBnDfx, _sender);
			IRewardTracker(feeDfxTracker).stakeForAccount(_sender, receiver, bnDfx, stakedBnDfx);
		}

		uint256 esDfxBalance = IERC20(esDfx).balanceOf(_sender);
		if (esDfxBalance > 0) {
			IERC20(esDfx).transferFrom(_sender, receiver, esDfxBalance);
		}

		uint256 dlpAmount = IRewardTracker(feeDlpTracker).depositBalances(_sender, dlp);
		if (dlpAmount > 0) {
			IRewardTracker(stakedDlpTracker).unstakeForAccount(_sender, feeDlpTracker, dlpAmount, _sender);
			IRewardTracker(feeDlpTracker).unstakeForAccount(_sender, dlp, dlpAmount, _sender);

			IRewardTracker(feeDlpTracker).stakeForAccount(_sender, receiver, dlp, dlpAmount);
			IRewardTracker(stakedDlpTracker).stakeForAccount(receiver, receiver, feeDlpTracker, dlpAmount);
		}

		IVester(dfxVester).transferStakeValues(_sender, receiver);
		IVester(dlpVester).transferStakeValues(_sender, receiver);
	}

	function _validateReceiver(address _receiver) private view {
		require(IRewardTracker(stakedDfxTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: stakedDfxTracker.averageStakedAmounts > 0");
		require(IRewardTracker(stakedDfxTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: stakedDfxTracker.cumulativeRewards > 0");

		require(IRewardTracker(bonusDfxTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: bonusDfxTracker.averageStakedAmounts > 0");
		require(IRewardTracker(bonusDfxTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: bonusDfxTracker.cumulativeRewards > 0");

		require(IRewardTracker(feeDfxTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: feeDfxTracker.averageStakedAmounts > 0");
		require(IRewardTracker(feeDfxTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: feeDfxTracker.cumulativeRewards > 0");

		require(IVester(dfxVester).transferredAverageStakedAmounts(_receiver) == 0, "RewardRouter: dfxVester.transferredAverageStakedAmounts > 0");
		require(IVester(dfxVester).transferredCumulativeRewards(_receiver) == 0, "RewardRouter: dfxVester.transferredCumulativeRewards > 0");

		require(IRewardTracker(stakedDlpTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: stakedDlpTracker.averageStakedAmounts > 0");
		require(IRewardTracker(stakedDlpTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: stakedDlpTracker.cumulativeRewards > 0");

		require(IRewardTracker(feeDlpTracker).averageStakedAmounts(_receiver) == 0, "RewardRouter: feeDlpTracker.averageStakedAmounts > 0");
		require(IRewardTracker(feeDlpTracker).cumulativeRewards(_receiver) == 0, "RewardRouter: feeDlpTracker.cumulativeRewards > 0");

		require(IVester(dlpVester).transferredAverageStakedAmounts(_receiver) == 0, "RewardRouter: dfxVester.transferredAverageStakedAmounts > 0");
		require(IVester(dlpVester).transferredCumulativeRewards(_receiver) == 0, "RewardRouter: dfxVester.transferredCumulativeRewards > 0");

		require(IERC20(dfxVester).balanceOf(_receiver) == 0, "RewardRouter: dfxVester.balance > 0");
		require(IERC20(dlpVester).balanceOf(_receiver) == 0, "RewardRouter: dlpVester.balance > 0");
	}

	function _compound(address _account) private {
		_compoundDfx(_account);
		_compoundDlp(_account);
	}

	function _compoundDfx(address _account) private {
		uint256 esDfxAmount = IRewardTracker(stakedDfxTracker).claimForAccount(_account, _account);
		if (esDfxAmount > 0) {
			_stakeDfx(_account, _account, esDfx, esDfxAmount);
		}

		uint256 bnDfxAmount = IRewardTracker(bonusDfxTracker).claimForAccount(_account, _account);
		if (bnDfxAmount > 0) {
			IRewardTracker(feeDfxTracker).stakeForAccount(_account, _account, bnDfx, bnDfxAmount);
		}
	}

	function _compoundDlp(address _account) private {
		uint256 esDfxAmount = IRewardTracker(stakedDlpTracker).claimForAccount(_account, _account);
		if (esDfxAmount > 0) {
			_stakeDfx(_account, _account, esDfx, esDfxAmount);
		}
	}

	function _stakeDfx(address _fundingAccount, address _account, address _token, uint256 _amount) private {
		require(_amount > 0, "RewardRouter: invalid _amount");

		IRewardTracker(stakedDfxTracker).stakeForAccount(_fundingAccount, _account, _token, _amount);
		IRewardTracker(bonusDfxTracker).stakeForAccount(_account, _account, stakedDfxTracker, _amount);
		IRewardTracker(feeDfxTracker).stakeForAccount(_account, _account, bonusDfxTracker, _amount);

		emit StakeDfx(_account, _token, _amount);
	}

	function _unstakeDfx(address _account, address _token, uint256 _amount, bool _shouldReduceBnDfx) private {
		require(_amount > 0, "RewardRouter: invalid _amount");

		uint256 balance = IRewardTracker(stakedDfxTracker).stakedAmounts(_account);

		IRewardTracker(feeDfxTracker).unstakeForAccount(_account, bonusDfxTracker, _amount, _account);
		IRewardTracker(bonusDfxTracker).unstakeForAccount(_account, stakedDfxTracker, _amount, _account);
		IRewardTracker(stakedDfxTracker).unstakeForAccount(_account, _token, _amount, _account);

		if (_shouldReduceBnDfx) {
			uint256 bnDfxAmount = IRewardTracker(bonusDfxTracker).claimForAccount(_account, _account);
			if (bnDfxAmount > 0) {
				IRewardTracker(feeDfxTracker).stakeForAccount(_account, _account, bnDfx, bnDfxAmount);
			}

			uint256 stakedBnDfx = IRewardTracker(feeDfxTracker).depositBalances(_account, bnDfx);
			if (stakedBnDfx > 0) {
				uint256 reductionAmount = (stakedBnDfx * (_amount)) / (balance);
				IRewardTracker(feeDfxTracker).unstakeForAccount(_account, bnDfx, reductionAmount, _account);
				IMintable(bnDfx).burn(_account, reductionAmount);
			}
		}

		emit UnstakeDfx(_account, _token, _amount);
	}
}
