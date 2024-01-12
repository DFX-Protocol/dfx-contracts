import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "Vester[DlpVester]";
const contractDependencies = ["EsDFX", "DFX", "RewardTracker[stakedDlpTracker]"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const vestingDuration = 365 * 24 * 60 * 60;
	const dependencies = await GetDeployedContracts(hre, contractDependencies);

	const constructorParameters =
	[
		"Vested DLP",
		"vDLP",
		vestingDuration, // _vestingDuration
		dependencies["EsDFX"].address, // _esToken
		dependencies["RewardTracker[stakedDlpTracker]"].address, // _pairToken
		dependencies["DFX"].address, // _claimableToken
		dependencies["RewardTracker[stakedDlpTracker]"].address, // _rewardTracker
	];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];