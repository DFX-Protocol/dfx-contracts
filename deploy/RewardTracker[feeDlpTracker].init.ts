import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler, CallUpdateLastDistributionTime, GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "RewardTracker[feeDlpTracker]";
const contractDependencies = [contract, "DLP", "RewardDistributor[feeDlpDistributor]", "RewardRouterV2", "RewardRouterV2[DLP]", "RewardTracker[stakedDlpTracker]"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			[dependencies["DLP"].address],
			dependencies["RewardDistributor[feeDlpDistributor]"].address
		],
		async (deployer) =>
		{
			await CallUpdateLastDistributionTime(hre, "RewardDistributor[feeDlpDistributor]", deployer);
		});
	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "RewardRouterV2[DLP]");
	await CallSetHandler(hre, contract, "RewardTracker[stakedDlpTracker]");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];