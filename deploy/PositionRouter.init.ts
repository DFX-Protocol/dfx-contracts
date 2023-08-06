import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallAddPlugin, CallSetHandler, CallSetAdmin, CallSetGov, CallSetReferralStorage, getContractGov, CallSetDelayValues } from "../scripts/DeployHelper";

const contract = "PositionRouter";
const contractDependencies =
	[
		contract,
		"Router",
		"Vault",
		"ReferralStorage"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	
	await CallSetReferralStorage(hre, contract, "ReferralStorage");
	await CallAddPlugin(hre, "Router", contract);
	// TODO:[MAINNET] Update below delay values
	await CallSetDelayValues(hre, contract, 
		0,			// minBlockDelayKeeper
		180, 		// minTimeDelayPublic
		30 * 60		// maxTimeDelay
	);
	await CallSetHandler(hre, "ShortsTracker", contract);
	const vaultGov = await getContractGov(hre, "Vault");
	await CallSetGov(hre, contract, vaultGov, false);
	const { capKeeper } = await getNamedAccounts();
	await CallSetAdmin(hre, contract, capKeeper);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];