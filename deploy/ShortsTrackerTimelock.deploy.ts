import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "ShortTrackerTimelock";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	
	// TODO:[MAINNET] Update following params
	const buffer = 60; // 60 seconds
	const updateDelay = 300; // 300 seconds, 5 minutes
	const maxAveragePriceChange = 20; // 0.2%
	
	const constructorParameters = 
	[
		deployer, // admin
		buffer,
		updateDelay,
		maxAveragePriceChange
	];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "mainnet", "timelocks"];