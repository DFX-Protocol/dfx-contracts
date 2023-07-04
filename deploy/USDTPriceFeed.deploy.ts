import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "PriceFeed[USDT]";
// TODO: Check if this needs to be deployed on mainnet
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await UnifiedDeploy(hre, contract);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [`${contract}`, "testnet"];
