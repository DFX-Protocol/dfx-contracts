import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { 
	CallSetVaultUtils, 
	CallSetLiquidatorTl,
	CallSetContractHandler, 
	CallSignalSetHandlerTl, 
	CallSetFees, 
	toUsd, 
	CallSetGov
} from "../scripts/DeployHelper";
import { tokens } from "../config/Constants";

const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const contract = "Timelock";

const contractDependencies = [
	contract,
	"PositionManager", 
	"Vault", 
	"PositionRouter", 
	"ReferralStorage", 
	"VaultUtils",
	"EsGMX",
	"Vester[GmxVester]",
	"Vester[GlpVester]",
	"RewardTracker[stakedGlpTracker]",
	"RewardTracker[feeGlpTracker]",
	tokens[chainId].USDT.contractName,
	tokens[chainId].USDT.priceFeedContractName,
	tokens[chainId].BTC.contractName,
	tokens[chainId].BTC.priceFeedContractName,
	tokens[chainId].BNB.contractName,
	tokens[chainId].BNB.priceFeedContractName,
	tokens[chainId].BUSD.contractName,
	tokens[chainId].BUSD.priceFeedContractName,
	tokens[chainId].WETH.contractName,
	tokens[chainId].WETH.priceFeedContractName,

];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	// For PositionManager
	await CallSetContractHandler(hre, contract, "PositionManager");
	await CallSetLiquidatorTl(hre, contract, "Vault", "PositionManager");

	// For PositionRouter
	await CallSetContractHandler(hre, contract, "PositionRouter");
	await CallSignalSetHandlerTl(hre, contract, "ReferralStorage", "PositionRouter", true);

	// For VaultUtils
	await CallSetVaultUtils(hre, contract, "VaultUtils");

	// For Vault
	// TODO:[MAINNET] Update following params
	// Basis point parameters below has a precision of 2. For example: 50 means 0.5%
	const feeParams = [
		50, // _taxBasisPoints
		5, // _stableTaxBasisPoints
		25, // _mintBurnFeeBasisPoints
		30, // _swapFeeBasisPoints
		1, // _stableSwapFeeBasisPoints
		10, // _marginFeeBasisPoints
		toUsd(5), // _liquidationFeeUsd
		3 * 60 * 60, // _minProfitTime
		true // _hasDynamicFees
	];
	await CallSetFees(hre, contract, feeParams);

	// For EsGMX
	await CallSetGov(hre, "EsGMX", contract);

	// For GmxVester
	await CallSetGov(hre, "Vester[GmxVester]", contract);

	// For GlpVester
	await CallSetGov(hre, "Vester[GlpVester]", contract);

	// For StakedGlpTracker
	await CallSetGov(hre, "RewardTracker[stakedGlpTracker]", contract);

	// For FeeGlpTracker
	await CallSetGov(hre, "RewardTracker[feeGlpTracker]", contract);

};

export default func;

func.id = `Deploy_${contract}_Config`; // id required to prevent reexecution
func.tags = [`${contract}_Config`, "mainnet", "timelocks"];
func.dependencies = [...contractDependencies];