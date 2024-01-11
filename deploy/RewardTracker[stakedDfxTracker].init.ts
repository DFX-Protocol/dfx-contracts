import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler, CallUpdateLastDistributionTime, GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "RewardTracker[stakedDfxTracker]";
const contractDependencies = [contract, "DFX", "EsDFX", "RewardDistributor[stakedDfxDistributor]", "RewardRouterV2", "RewardTracker[bonusDfxTracker]"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			[dependencies["DFX"].address, dependencies["EsDFX"].address],
			dependencies["RewardDistributor[stakedDfxDistributor]"].address
		],
		async (deployer) =>
		{
			await CallUpdateLastDistributionTime(hre, "RewardDistributor[stakedDfxDistributor]", deployer);
		});
	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "RewardTracker[bonusDfxTracker]");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];