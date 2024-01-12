import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler, CallUpdateLastDistributionTime, GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "RewardTracker[stakedDlpTracker]";
const contractDependencies = [contract, "RewardDistributor[stakedDlpDistributor]", "RewardRouterV2", "RewardRouterV2[DLP]", "Vester[DlpVester]", "RewardTracker[feeDlpTracker]"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			[dependencies["RewardTracker[feeDlpTracker]"].address],
			dependencies["RewardDistributor[stakedDlpDistributor]"].address
		],
		async (deployer) =>
		{
			await CallUpdateLastDistributionTime(hre, "RewardDistributor[stakedDlpDistributor]", deployer);
		});
	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "RewardRouterV2[DLP]");
	await CallSetHandler(hre, contract, "Vester[DlpVester]");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];