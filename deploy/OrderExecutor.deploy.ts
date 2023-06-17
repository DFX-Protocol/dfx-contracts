import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "OrderExecutor";
const contractDependencies =
	[
		contract,
		"OrderBook",
		"Vault"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const initParameters =
	[
		dependencies["Vault"].address,
		dependencies["OrderBook"].address
	];
	await UnifiedInitialize(hre, contract, initParameters);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`];
func.dependencies = [...contractDependencies];