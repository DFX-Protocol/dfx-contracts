import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";
import { GetTokenAddress } from "../config/DeployConstants";

const contract = "RewardDistributor[feeDlpDistributor]";
const contractDependencies = ["RewardTracker[feeDlpTracker]"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const { nativeToken } = await GetTokenAddress();
	const constructorParameters = [nativeToken, dependencies["RewardTracker[feeDlpTracker]"].address];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];