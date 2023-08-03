import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy, expandDecimals } from "../scripts/DeployHelper";
import { ethers } from "hardhat";

const { AddressZero } = ethers.constants;

const contract = "GmxTimelock";
const contractDependencies = ["TokenManager"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	
	// TODO:[MAINNET] Update following params
	const buffer = 24 * 60 * 60;
	const longBuffer = 7 * 24 * 60 * 60;
	const mintReceiver = { address: AddressZero };
	const maxTokenSupply = expandDecimals(13250000, 18);
	const rewardManager = { address: AddressZero };

	const dependencies = await GetDeployedContracts(hre, contractDependencies);

	const constructorParameters = 
	[
		deployer, // admin
		buffer,
		longBuffer,
		rewardManager.address,
		dependencies["TokenManager"].address,
		mintReceiver.address,
		maxTokenSupply
	];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "mainnet", "timelocks"];
func.dependencies = [...contractDependencies];