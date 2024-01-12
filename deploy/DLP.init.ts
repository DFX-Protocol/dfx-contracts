import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler } from "../scripts/DeployHelper";

const contract = "DLP";
const contractDependencies =
	[
		contract,
		"RewardTracker[feeDlpTracker]"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await CallSetHandler(hre, contract, "RewardTracker[feeDlpTracker]");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];