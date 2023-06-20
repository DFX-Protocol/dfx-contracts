import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler, CallUpdateLastDistributionTime, GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "RewardTracker[bonusGmxTracker]";
const contractDependencies = [
	contract,
	"RewardTracker[stakedGmxTracker]",
	"BonusDistributor",
	"RewardTracker[feeGmxTracker]",
	"RewardRouterV2"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			[dependencies["RewardTracker[stakedGmxTracker]"].address],
			dependencies["BonusDistributor"].address
		],
		async (deployer) =>
		{
			await CallUpdateLastDistributionTime(hre, contract, "BonusDistributor", deployer);
		});
	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "RewardTracker[feeGmxTracker]");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`];
func.dependencies = [...contractDependencies];