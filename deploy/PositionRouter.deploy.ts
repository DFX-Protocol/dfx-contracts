import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";
import { GetTokenAddress } from "../scripts/DeployConstants";

const contract = "PositionRouter";
const contractDependencies =
	[
		"Router",
		"Vault",
		"ShortsTracker",
		"PositionUtils"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { nativeToken } = await GetTokenAddress();
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const constructorParameters =
	[
		dependencies["Vault"].address,
		dependencies["Router"].address,
		nativeToken, // weth
		dependencies["ShortsTracker"].address,
		30, // 0.3%
		"20000000000000000" // 0.02
	];
	await UnifiedDeploy(hre, contract, constructorParameters, { "PositionUtils": dependencies["PositionUtils"].address });
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract];
func.dependencies = [...contractDependencies];