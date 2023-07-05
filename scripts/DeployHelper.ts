import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { Deployment } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment, Libraries } from "hardhat/types";

export async function UnifiedDeploy(hre: HardhatRuntimeEnvironment, contract: string, constructorParameters: unknown[] | undefined = undefined, libraries?: Libraries): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();
	console.log(`\x1B[32m${contract}\x1B[0m - Deploying contract with deployer \x1B[33m${deployer}\x1B[0m ...`);
	if(constructorParameters !== undefined)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Using constuctor parameters \x1B[33m${JSON.stringify(constructorParameters)}\x1B[0m ...`);
	}
	if(libraries !== undefined)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Using external libraries \x1B[33m${JSON.stringify(libraries)}\x1B[0m ...`);
	}
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const result = await deploy(contract, { from: deployer, args: constructorParameters, log: false, contract: artifactName, libraries:libraries });
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
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setShouldToggleIsLeverageEnabled(true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setShouldToggleIsLeverageEnabled(true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setShouldToggleIsLeverageEnabled(true)\x1B[0m ...`);
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
		try
		{
			await (await updateContract.connect(depSign).signalApprove(newHandlerContractData.address, admin, value)).wait();
			console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.signalApprove("${newHandlerContractData.address}", "${admin}", ${value})\x1B[0m ...`);
		}
		catch (e)
		{
			console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.signalApprove("${newHandlerContractData.address}", "${admin}", ${value})\x1B[0m ...`);
		}
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.signalApprove("${newHandlerContractData.address}", "${admin}", ${value})\x1B[0m ...`);
	}
}

export async function CallSetVaultUtils(hre: HardhatRuntimeEnvironment, contract: string, vaultUtils: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	const vaultUtilsData = await deployments.get(vaultUtils);

	if ((await updateContract.vaultUtils()) !== vaultUtilsData.address)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setVaultUtils(${vaultUtilsData.address})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setVaultUtils(vaultUtilsData.address)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setVaultUtils(${vaultUtilsData.address})\x1B[0m ...`);
	}
}

export async function CallSetShouldValidateIncreaseOrder(hre: HardhatRuntimeEnvironment, contract: string, value: boolean): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	if ((await updateContract.shouldValidateIncreaseOrder()) !== value)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setShouldValidateIncreaseOrder(${value})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setShouldValidateIncreaseOrder(value)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setShouldValidateIncreaseOrder(${value})\x1B[0m ...`);
	}
}

export async function CallSetReferralStorage(hre: HardhatRuntimeEnvironment, contract: string, newStorageContractName: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	const newStorageContractData = await deployments.get(newStorageContractName);

	if ((await updateContract.referralStorage()) != newStorageContractData.address)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setReferralStorage("${newStorageContractData.address}")\x1B[0m ...`);
		await (await updateContract.connect(depSign).setReferralStorage(newStorageContractData.address)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setReferralStorage("${newStorageContractData.address}")\x1B[0m ...`);
	}
}

export async function CallSetKeeper2(hre: HardhatRuntimeEnvironment, contract: string, address: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	if (!await updateContract.isKeeper(address))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setKeeper("${address}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setKeeper(address, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setKeeper("${address}", true)\x1B[0m ...`);
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

export async function CallSetOrderKeeper(hre: HardhatRuntimeEnvironment, contract: string, newKeeperAddress: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	if (!await updateContract.isOrderKeeper(newKeeperAddress))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setOrderKeeper("${newKeeperAddress}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setOrderKeeper(newKeeperAddress, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setOrderKeeper("${newKeeperAddress}", true)\x1B[0m ...`);
	}
}

export async function CallAddPlugin(hre: HardhatRuntimeEnvironment, contract: string, pluginContractName: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	const pluginData = await deployments.get(pluginContractName);

	if (!(await updateContract.plugins(pluginData.address)))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.addPlugin("${pluginData.address}")\x1B[0m ...`);
		await (await updateContract.connect(depSign).addPlugin(pluginData.address)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.addPlugin("${pluginData}")\x1B[0m ...`);
	}
}

export async function CallSetLiquidator(hre: HardhatRuntimeEnvironment, contract: string, newLiquidatorAddress: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	if (!await updateContract.isLiquidator(newLiquidatorAddress))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setLiquidator("${newLiquidatorAddress}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setLiquidator(newLiquidatorAddress, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setLiquidator("${newLiquidatorAddress}", true)\x1B[0m ...`);
	}
}

export async function CallSetLiquidator2(hre: HardhatRuntimeEnvironment, contract: string, newLiquidatorContractName1: string, newLiquidatorContractName2: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	const newHandlerContractData1 = await deployments.get(newLiquidatorContractName1);
	const newHandlerContractData2 = await deployments.get(newLiquidatorContractName2);

	// The set Liquidator of newLiquidatorContractName1 is called inside the function.
	const artifactName1 = newLiquidatorContractName1.substring(0, index);
	const contractData1 = await deployments.get(newLiquidatorContractName1);
	const updateContract1 = await ethers.getContractAt(artifactName1, contractData1.address);

	if (!(await updateContract1.isLiquidator(newHandlerContractData2.address)))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setLiquidator("${newHandlerContractData1.address}", "${newHandlerContractData2.address}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setLiquidator(newHandlerContractData1.address, newHandlerContractData2.address, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setLiquidator("${newHandlerContractData1.address}", "${newHandlerContractData2.address}", true)\x1B[0m ...`);
	}
}

export async function CallSetGov(hre: HardhatRuntimeEnvironment, contract: string, govContractName: string): Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	const govContractData = await deployments.get(govContractName);
	const govAdr = govContractData.address;

	if ((await updateContract.gov()) !== govAdr)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setGov("${govAdr}")\x1B[0m ...`);
		await (await updateContract.connect(depSign).setGov(govAdr)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setGov("${govAdr}")\x1B[0m ...`);
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
	
	if (!await updateContract.isMinter(newMinterContractData.address))
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
		if(!item.endsWith("_Init") && !item.endsWith("_Config"))
			map[item] = await deployments.get(item);
	}

	return map;
}


export async function CallMockMint(hre: HardhatRuntimeEnvironment, contract: string, amountToMint: BigNumber)
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.mintMock(${deployer},${amountToMint})\x1B[0m ...`);
	await (await updateContract.mockMint(deployer, amountToMint)).wait();
}

export async function CallSetTokenConfig(hre: HardhatRuntimeEnvironment, contract: string, configParameters: any[])
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	const depSign = await ethers.getSigner(deployer);

	console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setTokenConfig(${configParameters[0].toString()}, ${configParameters[1].toString()}, ${configParameters[2].toString()}, ${configParameters[3].toString()})\x1B[0m ...`);
	await (await updateContract.connect(depSign).setTokenConfig(configParameters[0], configParameters[1], configParameters[2], configParameters[3])).wait();
}


export async function CallVaultSetTokenConfig(hre: HardhatRuntimeEnvironment, contract: string, configParameters: any[])
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(contract, contractData.address);
	const depSign = await ethers.getSigner(deployer);

	const timelockContract = await ethers.getContractAt("Timelock", await updateContract.gov());

	const vaultPropsLength = 14;
	
	const nativeToken = await deployments.get(configParameters[1]);
	const readerData = await deployments.get("Reader");
	const reader = await ethers.getContractAt("Reader",readerData.address);

	const vaultTokenInfo = await reader.getVaultTokenInfoV2(configParameters[2], nativeToken.address , 1, [configParameters[3]]);
	console.log(`\x1B[32m Reader\x1B[0m - Call \x1B[Reader.getVaultTokenInfoV2(${configParameters[2]}, ${nativeToken.address}, 1, ${configParameters[3]})\x1B[0m ...`);

	const token: any = {};
	console.log(vaultTokenInfo);
	token.poolAmount = BigNumber.from(vaultTokenInfo[vaultPropsLength]);
	token.reservedAmount = BigNumber.from(vaultTokenInfo[vaultPropsLength + 1]);
	token.availableAmount = BigNumber.from(token.poolAmount.sub(token.reservedAmount));
	token.usdgAmount = BigNumber.from(vaultTokenInfo[vaultPropsLength + 2]);
	token.redemptionAmount = BigNumber.from(vaultTokenInfo[vaultPropsLength + 3]);
	token.weight = vaultTokenInfo[vaultPropsLength + 4];
	token.bufferAmount = vaultTokenInfo[vaultPropsLength + 5];
	token.maxUsdgAmount = vaultTokenInfo[vaultPropsLength + 6];
	token.globalShortSize = vaultTokenInfo[vaultPropsLength + 7];
	token.maxGlobalShortSize = vaultTokenInfo[vaultPropsLength + 8];
	token.minPrice = vaultTokenInfo[vaultPropsLength + 9];
	token.maxPrice = vaultTokenInfo[vaultPropsLength + 10];
	token.guaranteedUsd = vaultTokenInfo[vaultPropsLength + 11];

	const tokenItem = configParameters[4];

	token.availableUsd = tokenItem.isStable
		? token.poolAmount
			.mul(token.minPrice)
			.div(expandDecimals(1, tokenItem.decimals))
		: token.availableAmount
			.mul(token.minPrice)
			.div(expandDecimals(1, tokenItem.decimals));

	token.managedUsd = token.availableUsd.add(token.guaranteedUsd);
	token.managedAmount = token.managedUsd
		.mul(expandDecimals(1, tokenItem.decimals))
		.div(token.minPrice);

	let usdgAmount = token.managedUsd.div(expandDecimals(1, 30 - 18));

	const adjustedMaxUsdgAmount = expandDecimals(tokenItem.maxUsdgAmount, 18);
	if (usdgAmount.gt(adjustedMaxUsdgAmount))
	{
		usdgAmount = adjustedMaxUsdgAmount;
	}
	const adjustedBufferAmount = expandDecimals(tokenItem.bufferAmount, tokenItem.decimals);
	console.log(`\x1B[32m Timelock\x1B[0m - Call \x1B[33mTimelock.setTokenConfig(${updateContract.address}, ${tokenItem.address}, ${tokenItem.tokenWeight}, ${tokenItem.minProfitBp}, ${adjustedMaxUsdgAmount}, ${adjustedBufferAmount})\x1B[0m ...`);

	await (await timelockContract.connect(depSign).setTokenConfig(
		updateContract.address, 
		tokenItem.address,  
		tokenItem.tokenWeight, 
		tokenItem.minProfitBps, 
		adjustedMaxUsdgAmount,
		adjustedBufferAmount,
		usdgAmount
	));
}

function expandDecimals(n: number, decimals: number) 
{
	return BigNumber.from(n).mul(BigNumber.from(10).pow(decimals));
}
  