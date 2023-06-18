import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetContractHandler, CallSetKeeper, CallSetLiquidator2, CallSetShouldToggleIsLeverageEnabled, CallSignalApprove } from "../scripts/DeployHelper";

const contract = "Timelock";
const contractDependencies = [contract, "PositionRouter", "PositionManager", "GMX", "Vault"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	await CallSetShouldToggleIsLeverageEnabled(hre, contract);
	await CallSetContractHandler(hre, contract, "PositionRouter");
	await CallSetContractHandler(hre, contract, "PositionManager");
	await CallSetKeeper(hre, contract, deployer);
	await CallSignalApprove(hre, contract, "GMX", deployer, "1000000000000000000");
	await CallSetLiquidator2(hre, contract, "Vault", "PositionManager");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`];
func.dependencies = [...contractDependencies];