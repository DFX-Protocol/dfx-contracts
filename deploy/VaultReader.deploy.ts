import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "VaultReader";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await UnifiedDeploy(hre, contract);

	// TODO: if needed for network create init.ts and setConfig to true...
	// if (network === "avax")
	// {
	// 	await sendTxn(reader.setConfig(true), "Reader.setConfig")
	// }
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract];