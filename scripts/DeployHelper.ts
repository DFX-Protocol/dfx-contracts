import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { Deployment } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment, Libraries } from "hardhat/types";
import { ADDRESS_ZERO } from "../tests/helpers";

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


export async function CallSetTokens(hre: HardhatRuntimeEnvironment, contract: string, btc: string, weth: string, bnb: string)
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setTokens(${btc}, ${weth}, ${bnb})\x1B[0m ...`);
	await (await updateContract.connect(depSign).setTokens(btc, weth, bnb)).wait();
}

export async function CallCreatePair(hre: HardhatRuntimeEnvironment, contract: string, factoryAddress: string, tokenA: string, tokenB: string)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const updateContract = await ethers.getContractAt(contract, factoryAddress);

	console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.createPair(${tokenA}, ${tokenB})\x1B[0m ...`);
	await (await updateContract.connect(depSign).createPair(tokenA, tokenB)).wait();
}


export async function CallSetPairs(hre: HardhatRuntimeEnvironment, contract: string, factory: string, factoryAddress: string, bnbAddress: string, busdAddress: string, btcAddress: string, wethAddress: string)
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const factoryContract = await ethers.getContractAt(factory, factoryAddress);
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);

	const bnbBusdPair = await factoryContract.getPair(bnbAddress,busdAddress);
	const btcBnbPair = await factoryContract.getPair(btcAddress,bnbAddress);
	const wethBnbPair = await factoryContract.getPair(wethAddress,bnbAddress);

	console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setPairs(${bnbBusdPair}, ${wethBnbPair}, ${btcBnbPair})\x1B[0m ...`);
	await (await updateContract.connect(depSign).setPairs(bnbBusdPair, wethBnbPair, btcBnbPair)).wait();
}


export async function CallAddLiquidity(hre: HardhatRuntimeEnvironment, contract: string, routerAddress: string, tokenA: string, tokenB: string, tokenAAmount: number, tokenBAmount: number, tokenADecimals: number, tokenBDecimals: number)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const updateContract = await ethers.getContractAt(artifactName, routerAddress);
	const deadline = new Date(Date.now()).getTime() + 10000;
	const tokenAAmountBN = convertToEther(tokenAAmount, tokenADecimals);
	const tokenBAmountBN = convertToEther(tokenBAmount, tokenBDecimals);
	// TODO: Check if there's already liquidity available then don't add more
	console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.addLiquidity(${tokenA}, ${tokenB}, ${tokenAAmountBN}, ${tokenBAmountBN}, 0, 0, ${deployer}, ${deadline})\x1B[0m ...`);
	await (await updateContract.connect(depSign).addLiquidity(tokenA, tokenB, tokenAAmountBN, tokenBAmountBN, 0, 0, deployer, deadline)).wait();
}



export async function CallApprove(hre: HardhatRuntimeEnvironment, contract: string, tokenAddress: string, spender: string, amount: number, decimals: number)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const updateContract = await ethers.getContractAt(artifactName, tokenAddress);

	const amountBN = convertToEther(amount, decimals);

	console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.approve("${spender}", "${amountBN}")\x1B[0m ...`);
	await (await updateContract.connect(depSign).approve(spender, amountBN)).wait();
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


export async function CallMockMint(hre: HardhatRuntimeEnvironment, contract: string, tokenAddress: string, amountToMint: BigNumber)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const updateContract = await ethers.getContractAt(artifactName, tokenAddress);
	console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.mintMock(${deployer},${amountToMint})\x1B[0m ...`);
	await (await updateContract.mockMint(deployer, amountToMint)).wait();
}

export async function CallPriceFeedSetTokenConfig(hre: HardhatRuntimeEnvironment, contract: string, configParameters: any[])
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	const depSign = await ethers.getSigner(deployer);

	const priceFeed = await updateContract.priceFeeds(configParameters[0]);
	if(priceFeed === undefined || priceFeed === ADDRESS_ZERO)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setTokenConfig(${configParameters[0].toString()}, ${configParameters[1].toString()}, ${configParameters[2].toString()}, ${configParameters[3].toString()})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setTokenConfig(configParameters[0], configParameters[1], configParameters[2], configParameters[3])).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setTokenConfig()\x1B[0m ...`);
	}
	
}


export async function CallSignalVaultSetTokenConfig(hre: HardhatRuntimeEnvironment, contract: string, configParameters: any[])
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const tokenItem = configParameters[0];
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(contract, contractData.address);
	const depSign = await ethers.getSigner(deployer);

	const timelockContract = await ethers.getContractAt("Timelock", await updateContract.gov());
	
	console.log(`\x1B[32mTimelock\x1B[0m - Call \x1B[33mTimelock.signalVaultSetTokenConfig(${updateContract.address}, ${tokenItem.address}, ${tokenItem.decimals}, ${tokenItem.tokenWeight}, ${tokenItem.minProfitBps}, ${expandDecimals(tokenItem.maxUsdgAmount,18)}, ${tokenItem.isStable}, ${tokenItem.isShortable})\x1B[0m ...`);
	// TODO: This needs to be checked first if `signalVaultSetTokenConfig` has already been called on given token
	await (await timelockContract.connect(depSign).signalVaultSetTokenConfig(
		updateContract.address, 
		tokenItem.address,  
		tokenItem.decimals, 
		tokenItem.tokenWeight, 
		tokenItem.minProfitBps,
		expandDecimals(tokenItem.maxUsdgAmount,18),
		tokenItem.isStable,
		tokenItem.isShortable
	));
}


export async function CallVaultSetTokenConfig(hre: HardhatRuntimeEnvironment, contract: string, configParameters: any[])
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const tokenItem = configParameters[0];
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	const depSign = await ethers.getSigner(deployer);

	const whitelisted = await updateContract.whitelistedTokens(tokenItem.address);
	if(!whitelisted)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setTokenConfig(${tokenItem.address}, ${tokenItem.decimals}, ${tokenItem.tokenWeight}, ${tokenItem.minProfitBps}, ${expandDecimals(tokenItem.maxUsdgAmount, 18)}, ${tokenItem.isStable}, ${tokenItem.isShortable})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setTokenConfig(
			tokenItem.address, 
			tokenItem.decimals, 
			tokenItem.tokenWeight, 
			tokenItem.minProfitBps,
			expandDecimals(tokenItem.maxUsdgAmount, 18),
			tokenItem.isStable,
			tokenItem.isShortable)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setTokenConfig()\x1B[0m ...`);
	}
	
}

export async function CallSetLatestAnswer(hre: HardhatRuntimeEnvironment, contract: string, seedValue: number, decimals: number)
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	const artifactName = contract.substring(0, index);
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	const depSign = await ethers.getSigner(deployer);

	const price = convertToEther(seedValue, decimals);
	console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33m${contract}.setLatestAnswer(${price})\x1B[0m ...`);
	await (await updateContract.connect(depSign).setLatestAnswer(price)).wait();
}


export async function CallTimelockSetTokenConfig(hre: HardhatRuntimeEnvironment, contract: string, configParameters: any[])
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const contractData = await deployments.get(contract);
	const updateContract = await ethers.getContractAt(contract, contractData.address);
	const depSign = await ethers.getSigner(deployer);

	const timelockContract = await ethers.getContractAt("Timelock", await updateContract.gov());
	
	const nativeToken = await deployments.get(configParameters[1]);
	const readerData = await deployments.get("Reader");
	const reader = await ethers.getContractAt("Reader",readerData.address);

	console.log(`\x1B[32mReader\x1B[0m - Call \x1B[33mReader.getVaultTokenInfoV2(${configParameters[2]}, ${nativeToken.address}, 1, ${configParameters[3]})\x1B[0m ...`);
	const vaultTokenInfo = await reader.getVaultTokenInfoV2(configParameters[2], nativeToken.address , 1, [configParameters[3]]);

	const token: any = {};
	token.poolAmount = BigNumber.from(vaultTokenInfo[0]);
	token.reservedAmount = BigNumber.from(vaultTokenInfo[1]);
	token.availableAmount = BigNumber.from(token.poolAmount.sub(token.reservedAmount));
	token.usdgAmount = BigNumber.from(vaultTokenInfo[2]);
	token.redemptionAmount = BigNumber.from(vaultTokenInfo[3]);
	token.weight = vaultTokenInfo[4];
	token.bufferAmount = vaultTokenInfo[5];
	token.maxUsdgAmount = vaultTokenInfo[6];
	token.globalShortSize = vaultTokenInfo[7];
	token.maxGlobalShortSize = vaultTokenInfo[8];
	token.minPrice = vaultTokenInfo[9];
	token.maxPrice = vaultTokenInfo[10];
	token.guaranteedUsd = vaultTokenInfo[11];
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
	console.log(`\x1B[32mTimelock\x1B[0m - Call \x1B[33mTimelock.setTokenConfig(${updateContract.address}, ${tokenItem.address}, ${tokenItem.tokenWeight}, ${tokenItem.minProfitBps}, ${adjustedMaxUsdgAmount}, ${adjustedBufferAmount}, ${usdgAmount})\x1B[0m ...`);

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
	if(n !== undefined)
	{
		return BigNumber.from(n).mul(BigNumber.from(10).pow(decimals));
	}
	else
	{
		console.log("Warning: Expanding decimal of an undefined number. Be Careful");
		return BigNumber.from(0);
	}
}

export async function PrintAllAddresses(hre: HardhatRuntimeEnvironment)
{
	// ContractName: UIContractName
	const data = {
		"Vault": "Vault", "Router": "Router", "VaultReader": "VaultReader", "Reader": "Reader", "GlpManager": "GlpManager",
		"RewardRouterV2": "RewardRouter", "RewardRouterV2[GLP]": "GlpRewardRouter", "RewardReader": "RewardReader", "GLP": "GLP", 
		"GMX": "GMX", "EsGMX": "ES_GMX", "MintableBaseToken[bnGMX]": "BN_GMX", "USDG": "USDG", "MintableBaseToken[esGMX_IOU]": "ES_GMX_IOU",
		"RewardTracker[stakedGmxTracker]": "StakedGmxTracker", "RewardTracker[bonusGmxTracker]": "BonusGmxTracker", 
		"RewardTracker[feeGmxTracker]": "FeeGmxTracker", "RewardTracker[stakedGlpTracker]": "StakedGlpTracker",
		"RewardTracker[feeGlpTracker]": "FeeGlpTracker", "RewardDistributor[stakedGmxDistributor]": "StakedGmxDistributor", 
		"RewardDistributor[stakedGlpDistributor]": "StakedGlpDistributor", "Vester[GmxVester]": "GmxVester", "Vester[GlpVester]": "GlpVester",
		"OrderBook": "OrderBook", "OrderExecutor": "OrderExecutor", "OrderBookReader": "OrderBookReader", "PositionRouter": "PositionRouter", 
		"PositionManager": "PositionManager", "ReferralStorage": "ReferralStorage", "ReferralReader": "ReferralReader", "Timelock": "Timelock"
	};
	const contracts = Object.keys(data);
	const { deployments } = hre;
    
	for(const contract of contracts)
	{
		const contractData = await deployments.get(contract);
		console.log(`${data[contract]}: "${contractData.address}",`);
	}
}

function convertToEther(value: number, decimals: number)
{
	return ethers.utils.parseUnits( value.toString(), decimals);
}
  