import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetGov, CallSetLiquidator, CallSetOrderKeeper, CallSetReferralStorage, CallSetShouldValidateIncreaseOrder } from "../scripts/DeployHelper";

const contract = "PositionManager";
const contractDependencies =
	[
		contract,
		"ReferalStorage"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	// const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();

	await CallSetReferralStorage(hre, contract, "ReferalStorage");
	await CallSetShouldValidateIncreaseOrder(hre, contract, false);
	await CallSetOrderKeeper(hre, contract, deployer);
	await CallSetLiquidator(hre, contract, deployer);
	//TODO? Maybe set Partner Contracts with .setPartner function
	await CallSetGov(hre, contract, "Vault");
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`];
func.dependencies = [...contractDependencies];