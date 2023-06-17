import { BigNumber } from "ethers";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetBonusMultiplier, GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "BonusDistributor";
const contractDependencies = ["MintableBaseToken", "RewardTracker[bonusGmxTracker]"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const constructorParameters = [dependencies["MintableBaseToken"].address, dependencies["RewardTracker[bonusGmxTracker]"].address];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract];
func.dependencies = [...contractDependencies];