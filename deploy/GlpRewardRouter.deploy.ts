import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import { GetTokenAddress } from "../scripts/DeployConstants";

const contract = "RewardRouterV2[GLP]";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { nativeToken } = await GetTokenAddress();
	const constructorParameters = [nativeToken];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mainnet"];