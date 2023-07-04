import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler } from "../scripts/DeployHelper";

const contract = "GlpManager";
const contractDependencies = 
[
	contract,
	"RewardRouterV2",
	"RewardRouterV2[GLP]"

];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "RewardRouterV2[GLP]");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];