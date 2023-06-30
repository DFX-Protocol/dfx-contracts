import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "MintableBaseToken[bnGMX]";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const constructorParameters = ["Bonus GMX", "bnGMX", 0];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mainnet"];