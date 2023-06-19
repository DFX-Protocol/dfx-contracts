import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "Vester[GlpVester]";
const contractDependencies = ["EsGMX", "GMX", "RewardTracker[stakedGlpTracker]"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const vestingDuration = 365 * 24 * 60 * 60;
	const dependencies = await GetDeployedContracts(hre, contractDependencies);

	const constructorParameters =
	[
		"Vested GLP",
		"vGLP",
		vestingDuration, // _vestingDuration
		dependencies["EsGMX"].address, // _esToken
		dependencies["RewardTracker[stakedGlpTracker]"].address, // _pairToken
		dependencies["GMX"].address, // _claimableToken
		dependencies["RewardTracker[stakedGlpTracker]"].address, // _rewardTracker
	];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract];
func.dependencies = [...contractDependencies];