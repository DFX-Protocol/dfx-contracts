import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PrintAllAddresses } from "../scripts/DeployHelper";

const contractDependencies =
	[
		"Vault",
		"Router",
		"VaultReader",
		"Reader",
		"GlpManager",
		"RewardRouterV2",
		"RewardRouterV2[GLP]",
		"RewardReader",
		"GLP", 
		"DFX", 
		"EsDFX", 
		"MintableBaseToken[bnDFX]",
		"USDG",
		"MintableBaseToken[esDFX_IOU]",
		"RewardTracker[stakedDfxTracker]",
		"RewardTracker[bonusDfxTracker]", 
		"RewardTracker[feeDfxTracker]",
		"RewardTracker[stakedGlpTracker]",
		"RewardTracker[feeGlpTracker]",
		"RewardDistributor[stakedDfxDistributor]", 
		"RewardDistributor[stakedGlpDistributor]",
		"Vester[DfxVester]",
		"Vester[GlpVester]",
		"OrderBook",
		"OrderExecutor", 
		"OrderBookReader",
		"PositionRouter", 
		"PositionManager",
		"ReferralStorage",
		"ReferralReader",
		"Timelock"

	];
const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await PrintAllAddresses(hre, chainId);
};

export default func;

func.id = "PrintAll"; // id required to prevent reexecution
func.tags = ["PrintAll", "testnet", "mainnet"];
func.dependencies = [...contractDependencies];