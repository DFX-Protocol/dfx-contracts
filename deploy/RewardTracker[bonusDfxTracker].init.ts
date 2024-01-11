import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler, CallUpdateLastDistributionTime, GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "RewardTracker[bonusDfxTracker]";
const contractDependencies = [
	contract,
	"RewardTracker[stakedDfxTracker]",
	"BonusDistributor",
	"RewardTracker[feeDfxTracker]",
	"RewardRouterV2"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			[dependencies["RewardTracker[stakedDfxTracker]"].address],
			dependencies["BonusDistributor"].address
		],
		async (deployer) =>
		{
			await CallUpdateLastDistributionTime(hre, "BonusDistributor", deployer);
		});
	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "RewardTracker[feeDfxTracker]");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];