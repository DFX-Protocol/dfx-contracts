import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler, CallSetMinter } from "../scripts/DeployHelper";

const contract = "MintableBaseToken[bnGMX]";
const contractDependencies =
	[
		contract,
		"RewardRouterV2",
		"RewardTracker[feeGmxTracker]"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await CallSetHandler(hre, contract, "RewardTracker[feeGmxTracker]");
	await CallSetMinter(hre, contract, "RewardRouterV2");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];