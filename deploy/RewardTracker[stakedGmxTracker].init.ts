import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler, CallUpdateLastDistributionTime, GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "RewardTracker[stakedGmxTracker]";
const contractDependencies = [contract, "GMX", "EsGMX", "RewardDistributor[stakedGmxDistributor]", "RewardRouterV2", "RewardTracker[bonusGmxTracker]"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			[dependencies["GMX"].address, dependencies["EsGMX"].address],
			dependencies["RewardDistributor[stakedGmxDistributor]"].address
		],
		async (deployer) =>
		{
			await CallUpdateLastDistributionTime(hre, contract, "RewardDistributor[stakedGmxDistributor]", deployer);
		});
	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "RewardTracker[bonusGmxTracker]");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];