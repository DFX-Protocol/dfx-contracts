import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { Deployment } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export async function UnifiedDeploy(hre: HardhatRuntimeEnvironment, contract: string, constructorParameters: unknown[] | undefined = undefined): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();
	console.log(`\x1B[32m${contract}\x1B[0m - Deploying contract with deployer \x1B[33m${deployer}\x1B[0m ...`);
	if(constructorParameters !== undefined)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Using constuctor parameters \x1B[33m${JSON.stringify(constructorParameters)}\x1B[0m ...`);
	}
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const result = await deploy(contract, { from: deployer, args: constructorParameters, log: false, contract: artifactName });
	console.log(`\x1B[32m${contract}\x1B[0m - ${result.newlyDeployed ? "deployed to" : "reused at"} \x1B[32m${result.address}\x1B[0m`);
}

export async function UnifiedInitialize(hre: HardhatRuntimeEnvironment, contract: string, initParameters: unknown[], postInit?: (deployer: string) => Promise<void>): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const contractData = await deployments.get(contract);
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const initContract = await ethers.getContractAt(artifactName, contractData.address);
	const isInitialized = await initContract.isInitialized();

	console.log(`\x1B[32m${contract}\x1B[0m - Initializing contract with account \x1B[33m${deployer}\x1B[0m ...`);
	if (!isInitialized)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Using init parameters \x1B[33m${JSON.stringify(initParameters)}\x1B[0m ...`);
		await (await initContract.connect(depSign).initialize(...initParameters)).wait();
		if(postInit !== undefined)
		{
			await postInit(deployer);
		}
		console.log(`\x1B[32m${contract}\x1B[0m - initialized`);
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - already initialized`);
	}
}

export async function CallSetShouldToggleIsLeverageEnabled(hre: HardhatRuntimeEnvironment, contract: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	if (!await updateContract.shouldToggleIsLeverageEnabled())
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.shouldToggleIsLeverageEnabled(true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setHandler(true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.shouldToggleIsLeverageEnabled(true)\x1B[0m ...`);
	}
}

export async function CallSignalApprove(hre: HardhatRuntimeEnvironment, contract: string, newHandlerContractName: string, admin: string, value: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	const newHandlerContractData = await deployments.get(newHandlerContractName);

	// TODO check bytecode pendingActions[_action]
	if (true)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.signalApprove("${newHandlerContractData.address}", "${admin}", ${value})\x1B[0m ...`);
		await (await updateContract.connect(depSign).signalApprove(newHandlerContractData.address, admin, value)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.signalApprove("${newHandlerContractData.address}", "${admin}", ${value})\x1B[0m ...`);
	}
}

export async function CallSetKeeper(hre: HardhatRuntimeEnvironment, contract: string, newHandlerContractName: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	const newHandlerContractData = await deployments.get(newHandlerContractName);

	if (!await updateContract.isKeeper(newHandlerContractData.address))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setKeeper("${newHandlerContractData.address}")\x1B[0m ...`);
		await (await updateContract.connect(depSign).setKeeper(newHandlerContractData.address)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setKeeper("${newHandlerContractData.address}")\x1B[0m ...`);
	}
}

export async function CallSetContractHandler(hre: HardhatRuntimeEnvironment, contract: string, newHandlerContractName: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	const newHandlerContractData = await deployments.get(newHandlerContractName);

	if (!await updateContract.isHandler(newHandlerContractData.address))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setContractHandler("${newHandlerContractData.address}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setContractHandler(newHandlerContractData.address, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setContractHandler("${newHandlerContractData.address}", true)\x1B[0m ...`);
	}
}

export async function CallSetHandler(hre: HardhatRuntimeEnvironment, contract: string, newHandlerContractName: string) : Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	const newHandlerContractData = await deployments.get(newHandlerContractName);
	
	if (!await updateContract.isHandler(newHandlerContractData.address))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setHandler("${newHandlerContractData.address}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setHandler(newHandlerContractData.address, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setHandler("${newHandlerContractData.address}", true)\x1B[0m ...`);
	}
}

export async function CallSetMinter(hre: HardhatRuntimeEnvironment, contract: string, newMinterContractName: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	const newMinterContractData = await deployments.get(newMinterContractName);
	
	if (!await updateContract.isHandler(newMinterContractData.address))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setMinter("${newMinterContractData.address}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setMinter(newMinterContractData.address, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setMinter("${newMinterContractData.address}", true)\x1B[0m ...`);
	}
}

export async function CallSetBonusMultiplier(hre: HardhatRuntimeEnvironment, contract: string, value: BigNumber): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	const depSign = await ethers.getSigner(deployer);
	const result: BigNumber = await updateContract.bonusMultiplierBasisPoints();
	if (!value.eq(result))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setBonusMultipilier(${value})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setBonusMultiplier(value)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setBonusMultipilier(${value})\x1B[0m ...`);
	}
}

export async function CallUpdateLastDistributionTime(hre: HardhatRuntimeEnvironment, contract: string, updateContractName: string, deployer: string) : Promise<void>
{
	const { deployments } = hre;
	console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${updateContractName}.updateLastDistributionTime()\x1B[0m ...`);
	const index = updateContractName.indexOf("[") === -1 ? undefined : updateContractName.indexOf("[");
	const artifactName = updateContractName.substring(0, index);
	const contractData = await deployments.get(updateContractName);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	const depSign = await ethers.getSigner(deployer);
	await (await updateContract.connect(depSign).updateLastDistributionTime()).wait();
}

export async function GetDeployedContracts(hre: HardhatRuntimeEnvironment, contracts: string[]): Promise<{ [index: string]: Deployment }>
{
	const { deployments } = hre;

	const map:{[index: string]: Deployment} = {};
	for (const item of contracts)
	{
		map[item] = await deployments.get(item);
	}

	return map;
}