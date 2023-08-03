import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";


const contract = "PriceFeedTimelock";
const contractDependencies = ["TokenManager"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	
	// TODO:[MAINNET] Update following params
	const buffer = 24 * 60 * 60;

	const dependencies = await GetDeployedContracts(hre, contractDependencies);

	const constructorParameters = 
	[
		deployer, // admin
		buffer,
		dependencies["TokenManager"].address,
	];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "mainnet", "timelocks"];
func.dependencies = [...contractDependencies];