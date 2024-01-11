import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler, CallSetMinter, CallUpdateLastDistributionTime, GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "RewardTracker[feeDfxTracker]";
const contractDependencies = [contract, "RewardTracker[bonusDfxTracker]", "MintableBaseToken[bnDFX]", "RewardDistributor[feeDfxDistributor]", "RewardRouterV2", "Vester[DfxVester]"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			[dependencies["RewardTracker[bonusDfxTracker]"].address, dependencies["MintableBaseToken[bnDFX]"].address],
			dependencies["RewardDistributor[feeDfxDistributor]"].address
		],
		async (deployer) =>
		{
			await CallUpdateLastDistributionTime(hre, "RewardDistributor[feeDfxDistributor]", deployer);
		});
		
	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "Vester[DfxVester]");
	// allow feeDfxTracker to stake bnDfx
	await CallSetHandler(hre, "MintableBaseToken[bnDFX]", contract);
	// allow rewardRouter to burn bnDfx
	await CallSetMinter(hre, "MintableBaseToken[bnDFX]", contract);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];