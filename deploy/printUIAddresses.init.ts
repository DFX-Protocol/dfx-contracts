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
		"GMX", 
		"EsGMX", 
		"MintableBaseToken[bnGMX]",
		"USDG",
		"MintableBaseToken[esGMX_IOU]",
		"RewardTracker[stakedGmxTracker]",
		"RewardTracker[bonusGmxTracker]", 
		"RewardTracker[feeGmxTracker]",
		"RewardTracker[stakedGlpTracker]",
		"RewardTracker[feeGlpTracker]",
		"RewardDistributor[stakedGmxDistributor]", 
		"RewardDistributor[stakedGlpDistributor]",
		"Vester[GmxVester]",
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

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await PrintAllAddresses(hre);
};

export default func;

func.id = "PrintAll"; // id required to prevent reexecution
func.tags = ["PrintAll", "testnet", "mainnet"];
func.dependencies = [...contractDependencies];