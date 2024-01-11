import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetContractHandler, CallSetKeeper, CallSetShouldToggleIsLeverageEnabled, CallSignalApprove } from "../scripts/DeployHelper";

const contract = "Timelock";
const contractDependencies = [contract, "PositionRouter", "PositionManager", "DFX", "Vault"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	await CallSetShouldToggleIsLeverageEnabled(hre, contract);
	await CallSetContractHandler(hre, contract, "PositionRouter");
	await CallSetContractHandler(hre, contract, "PositionManager");
	await CallSetKeeper(hre, contract, deployer, false);
	await CallSignalApprove(hre, contract, "DFX", deployer, "1000000000000000000");
	// TODO: Only gov can do that. And timelock seems to be needed gov for Vaul. Needs to be analyses
	// await CallSetLiquidatorTl(hre, contract, "Vault", "PositionManager");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "mainnet", "timelocks"];
func.dependencies = [...contractDependencies];