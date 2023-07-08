import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallAddPlugin, CallSetHandler } from "../scripts/DeployHelper";

const contract = "PositionRouter";
const contractDependencies =
	[
		contract,
		"Router",
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await CallAddPlugin(hre, "Router", contract);
	await CallSetHandler(hre, "ShortsTracker", contract);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];