import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallAddPlugin } from "../scripts/DeployHelper";

const contract = "Router";
const contractDependencies =
	[
		contract,
		"PositionManager"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await CallAddPlugin(hre, contract, "PositionManager");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];