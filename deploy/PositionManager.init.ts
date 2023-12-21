import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetGov, CallSetLiquidator, CallSetOrderKeeper, CallSetReferralStorage, CallSetShouldValidateIncreaseOrder, CallSetHandler } from "../scripts/DeployHelper";

const contract = "PositionManager";
const contractDependencies =
	[
		contract,
		"ReferralStorage",
		"Vault",
		"ShortsTracker"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	// const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();

	await CallSetReferralStorage(hre, contract, "ReferralStorage");
	await CallSetShouldValidateIncreaseOrder(hre, contract, false);
	// TODO:[MAINNET] Set order keeper addresses here with real order keepers
	await CallSetOrderKeeper(hre, contract, deployer);
	// TODO:[MAINNET] Set liquidator's addresses here with real position liquidators
	await CallSetLiquidator(hre, contract, deployer);
	await CallSetGov(hre, contract, "Vault");
	await CallSetHandler(hre, "ShortsTracker", contract);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];