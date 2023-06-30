import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "Vester[GmxVester]";
const contractDependencies = ["EsGMX", "RewardTracker[feeGmxTracker]", "GMX", "RewardTracker[stakedGmxTracker]"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const vestingDuration = 365 * 24 * 60 * 60;
	const dependencies = await GetDeployedContracts(hre, contractDependencies);

	const constructorParameters =
	[
		"Vested GMX",
		"vGMX",
		vestingDuration, // _vestingDuration
		dependencies["EsGMX"].address, // _esToken
		dependencies["RewardTracker[feeGmxTracker]"].address, // _pairToken
		dependencies["GMX"].address, // _claimableToken
		dependencies["RewardTracker[stakedGmxTracker]"].address, // _rewardTracker
	];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];