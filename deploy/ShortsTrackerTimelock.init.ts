import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetGov, CallSetContractHandler, CallSignalSetHandlerTl } from "../scripts/DeployHelper";

const contract = "ShortsTrackerTimelock";
const contractDependencies = [contract, "ShortsTracker", "PositionRouter"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;

	await CallSetGov(hre, "ShortsTracker", contract);
	const { capKeeper } = await getNamedAccounts();
	await CallSetContractHandler(hre, contract, capKeeper, false);
	await CallSignalSetHandlerTl(hre, contract, contract, "PositionRouter", true);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "mainnet", "timelocks"];
func.dependencies = [...contractDependencies];