import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetHandler, CallSetMinter } from "../scripts/DeployHelper";

const contract = "EsGMX";
const contractDependencies =
	[
		contract,
		"RewardRouterV2",
		"RewardTracker[stakedGmxTracker]",
		"RewardTracker[stakedGlpTracker]",
		"RewardDistributor[stakedGmxDistributor]",
		"RewardDistributor[stakedGlpDistributor]",
		"Vester[GmxVester]",
		"Vester[GlpVester]"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "RewardTracker[stakedGmxTracker]");
	await CallSetHandler(hre, contract, "RewardTracker[stakedGlpTracker]");
	await CallSetHandler(hre, contract, "RewardDistributor[stakedGmxDistributor]");
	await CallSetHandler(hre, contract, "RewardDistributor[stakedGlpDistributor]");
	await CallSetHandler(hre, contract, "Vester[GmxVester]");
	await CallSetHandler(hre, contract, "Vester[GlpVester]");

	await CallSetMinter(hre, contract, "Vester[GmxVester]");
	await CallSetMinter(hre, contract, "Vester[GlpVester]");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];