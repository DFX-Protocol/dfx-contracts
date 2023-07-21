import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler, CallSetMinter, CallUpdateLastDistributionTime, GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "RewardTracker[feeGmxTracker]";
const contractDependencies = [contract, "RewardTracker[bonusGmxTracker]", "MintableBaseToken[bnGMX]", "RewardDistributor[feeGmxDistributor]", "RewardRouterV2", "Vester[GmxVester]"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			[dependencies["RewardTracker[bonusGmxTracker]"].address, dependencies["MintableBaseToken[bnGMX]"].address],
			dependencies["RewardDistributor[feeGmxDistributor]"].address
		],
		async (deployer) =>
		{
			await CallUpdateLastDistributionTime(hre, contract, "RewardDistributor[feeGmxDistributor]", deployer);
		});
		
	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "Vester[GmxVester]");
	// allow feeGmxTracker to stake bnGmx
	await CallSetHandler(hre, "MintableBaseToken[bnGMX]", contract);
	// allow rewardRouter to burn bnGmx
	await CallSetMinter(hre, "MintableBaseToken[bnGMX]", contract);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];