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

const contract = "Timelock";

const contractDependencies = [
	contract,
	"PositionManager", 
	"Vault", 
	"PositionRouter", 
	"ReferralStorage", 
	"VaultUtils",
	"EsDFX",
	"Vester[DfxVester]",
	"Vester[GlpVester]",
	"RewardTracker[stakedGlpTracker]",
	"RewardTracker[feeGlpTracker]",
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	// For PositionManager
	await CallSetContractHandler(hre, contract, "PositionManager");
	//await CallSetLiquidatorTl(hre, contract, "Vault", "PositionManager"); //Moved to Vault_Config

	// For PositionRouter
	await CallSetContractHandler(hre, contract, "PositionRouter");
	await CallSignalSetHandlerTl(hre, contract, "ReferralStorage", "PositionRouter", true);

	// For VaultUtils
	//await CallSetVaultUtils(hre, contract, "VaultUtils"); //Moved to Vault_Config

	// For Vault
	// TODO:[MAINNET] Update following params
	// Basis point parameters below has a precision of 2. For example: 50 means 0.5%
	// const feeParams = [
	// 	50, // _taxBasisPoints
	// 	5, // _stableTaxBasisPoints
	// 	25, // _mintBurnFeeBasisPoints
	// 	30, // _swapFeeBasisPoints
	// 	1, // _stableSwapFeeBasisPoints
	// 	10, // _marginFeeBasisPoints
	// 	toUsd(5), // _liquidationFeeUsd
	// 	3 * 60 * 60, // _minProfitTime
	// 	true // _hasDynamicFees
	// ];
	// await CallSetFees(hre, contract, feeParams); // Moved to Vault_Config

	// For EsDFX
	await CallSetGov(hre, "EsDFX", contract);

	// For DfxVester
	await CallSetGov(hre, "Vester[DfxVester]", contract);

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