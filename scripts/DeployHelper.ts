import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { Deployment } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment, Libraries } from "hardhat/types";
import { tokens } from "../config/Constants";
import { GetTokenAddress } from "../config/DeployConstants";

const { AddressZero } = ethers.constants;

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
	const artifactName = getArtifactName(contract);
	const result = await deploy(contract, { from: deployer, args: constructorParameters, log: false, contract: artifactName, libraries:libraries });
	console.log(`\x1B[32m${contract}\x1B[0m - ${result.newlyDeployed ? "✅ deployed to" : "reused at"} \x1B[32m${result.address}\x1B[0m`);
}

export async function UnifiedInitialize(hre: HardhatRuntimeEnvironment, contract: string, initParameters: unknown[], postInit?: (deployer: string) => Promise<void>): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const contractData = await getContractData(hre, contract);
	const artifactName = getArtifactName(contract);
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
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ initialized`);
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - already initialized`);
	}
}

export async function CallSetShouldToggleIsLeverageEnabled(hre: HardhatRuntimeEnvironment, contract: string): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	if (!await updateContract.shouldToggleIsLeverageEnabled())
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setShouldToggleIsLeverageEnabled(true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setShouldToggleIsLeverageEnabled(true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setShouldToggleIsLeverageEnabled(true)\x1B[0m ...`);
	}
}


export async function CallFastPriceFeedSetTokens(hre: HardhatRuntimeEnvironment, contract: string, tokensArr: string[], precisionArr: string[])
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	
	const updateContract = await getContract(hre, contract);
	const gov = await getContractGov(hre, contract);
	if(gov !== deployer)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ❌ Cannot set because deployer is not governer. Skip \x1B[33m${contract}.setTokens(${tokensArr},${precisionArr})\x1B[0m ...`);
		return;
	}
	// TODO: fix condition below
	const shouldUpdate = true;
	if (shouldUpdate)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setTokens(${tokensArr},${precisionArr})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setTokens(tokensArr,precisionArr)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setTokens(${tokensArr},${precisionArr})\x1B[0m ...`);
	}
}


export async function CallSetMaxCumulativeDeltaDiffs(hre: HardhatRuntimeEnvironment, contract: string, tokensArr: string[], diffsArr: string[])
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const tokenManager = await updateContract.tokenManager();
	if(tokenManager === deployer)
	{
		let shouldUpdate = false;
		for(let i = 0; i < tokensArr.length && !shouldUpdate; i++)
		{
			const maxCumulativeDeltaDiffs = await updateContract.maxCumulativeDeltaDiffs(tokensArr[i]);
			if(maxCumulativeDeltaDiffs !== diffsArr[i])
			{
				shouldUpdate = true;
			}
		}
		if (shouldUpdate)
		{
			console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setMaxCumulativeDeltaDiffs(${tokensArr},${diffsArr})\x1B[0m ...`);
			await (await updateContract.connect(depSign).setMaxCumulativeDeltaDiffs(tokensArr,diffsArr)).wait();
		}
		else
		{
			console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setMaxCumulativeDeltaDiffs(${tokensArr},${diffsArr})\x1B[0m ...`);
		}
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ❌ Cannot set because token manager is not deployer. Skip \x1B[33m${contract}.setMaxCumulativeDeltaDiffs(${tokensArr},${diffsArr})\x1B[0m ...`);
	}
	
}


export async function CallSetTokenManager(hre: HardhatRuntimeEnvironment, contract: string, tokenManager: string)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const updateContract = await getContract(hre, contract);
	const oldTokenManager = await updateContract.tokenManager();
	if (oldTokenManager!==tokenManager)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setTokenManager(${tokenManager})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setTokenManager(tokenManager)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setTokenManager(${tokenManager})\x1B[0m ...`);
	}
}


export async function CallSetIsPriceFeed(hre: HardhatRuntimeEnvironment, contract: string, priceFeed: string, isActive: boolean)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const isPriceFeed = await updateContract.isPriceFeed(priceFeed);
	if (!isPriceFeed)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setIsPriceFeed(${priceFeed}, ${isActive})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setIsPriceFeed(priceFeed, isActive)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setIsPriceFeed(${priceFeed}, ${isActive})\x1B[0m ...`);
	}
}


export async function CallSetFastPriceEvents(hre: HardhatRuntimeEnvironment, contract: string, priceFeedEvents: string)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const oldPriceFeedEvents = await updateContract.fastPriceEvents();
	if (oldPriceFeedEvents !== priceFeedEvents)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setFastPriceEvents(${priceFeedEvents})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setFastPriceEvents(priceFeedEvents)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setFastPriceEvents(${priceFeedEvents})\x1B[0m ...`);
	}
}


export async function CallSetPositionKeeper(hre: HardhatRuntimeEnvironment, contract: string, keeper: string, isActive: boolean)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const isKeeper = await updateContract.isPositionKeeper(keeper);
	if (!isKeeper)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setPositionKeeper(${keeper}, ${isActive})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setPositionKeeper(keeper, isActive)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setPositionKeeper(${keeper}, ${isActive})\x1B[0m ...`);
	}
}


export async function CallSetPriceDataInterval(hre: HardhatRuntimeEnvironment, contract: string, intervalData: number)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const oldIntervalData = await updateContract.priceDataInterval();
	if (oldIntervalData.toString() !== intervalData.toString())
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setPriceDataInterval(${intervalData})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setPriceDataInterval(intervalData)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setPriceDataInterval(${intervalData})\x1B[0m ...`);
	}
}

export async function CallSetSpreadBasisPointsIfChainError(hre: HardhatRuntimeEnvironment, contract: string, basisPoints: number)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const oldBasisPoints = await updateContract.spreadBasisPointsIfChainError();
	if (oldBasisPoints.toString() !== basisPoints.toString())
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setSpreadBasisPointsIfChainError(${basisPoints})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setSpreadBasisPointsIfChainError(basisPoints)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setSpreadBasisPointsIfChainError(${basisPoints})\x1B[0m ...`);
	}
}


export async function CallSetSpreadBasisPointsIfInactive(hre: HardhatRuntimeEnvironment, contract: string, basisPoints: number)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const oldBasisPoints = await updateContract.spreadBasisPointsIfInactive();
	if (oldBasisPoints.toString() !== basisPoints.toString())
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setSpreadBasisPointsIfInactive(${basisPoints})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setSpreadBasisPointsIfInactive(basisPoints)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setSpreadBasisPointsIfInactive(${basisPoints})\x1B[0m ...`);
	}
}

export async function CallSetMaxTimeDeviation(hre: HardhatRuntimeEnvironment, contract: string, deviation: number)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const oldMaxTimeDeviation = await updateContract.maxTimeDeviation();
	if (oldMaxTimeDeviation.toString() !== deviation.toString())
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setMaxTimeDeviation(${deviation})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setMaxTimeDeviation(deviation)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setMaxTimeDeviation(${deviation})\x1B[0m ...`);
	}
}


export async function CallSetVaultPriceFeed(hre: HardhatRuntimeEnvironment, contract: string, priceFeed: string)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const oldPriceFeed = await updateContract.vaultPriceFeed();
	if (oldPriceFeed !== priceFeed)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setVaultPriceFeed(${priceFeed})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setVaultPriceFeed(priceFeed)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setVaultPriceFeed(${priceFeed})\x1B[0m ...`);
	}
}

export async function CallSetTokens(hre: HardhatRuntimeEnvironment, contract: string, btc: string, weth: string, bnb: string)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const prevBtc = await updateContract.btc();
	const prevWeth = await updateContract.eth();
	const prevBnb = await updateContract.bnb();
	if(prevBtc !== btc || prevBnb !== bnb || prevWeth !== weth)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setTokens(${btc}, ${weth}, ${bnb})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setTokens(btc, weth, bnb)).wait();	
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setTokens(${btc}, ${weth}, ${bnb})\x1B[0m ...`);
	}
}

export async function CallCreatePair(hre: HardhatRuntimeEnvironment, contract: string, factoryAddress: string, tokenA: string, tokenB: string)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const updateContract = await ethers.getContractAt(contract, factoryAddress);

	const pair = await updateContract.getPair(tokenA, tokenB);
	if(pair === AddressZero)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.createPair(${tokenA}, ${tokenB})\x1B[0m ...`);
		await (await updateContract.connect(depSign).createPair(tokenA, tokenB)).wait();	
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already created. Skip \x1B[33m${contract}.createPair(${tokenA}, ${tokenB})\x1B[0m ...`);
	}
}


export async function CallSetPairs(hre: HardhatRuntimeEnvironment, contract: string, factory: string, factoryAddress: string, bnbAddress: string, busdAddress: string, btcAddress: string, wethAddress: string)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const factoryContract = await ethers.getContractAt(factory, factoryAddress);
	const updateContract = await getContract(hre, contract);

	const bnbBusdPair = await factoryContract.getPair(bnbAddress,busdAddress);
	const btcBnbPair = await factoryContract.getPair(btcAddress,bnbAddress);
	const wethBnbPair = await factoryContract.getPair(wethAddress,bnbAddress);

	const prevBnbBusdPair = await updateContract.bnbBusd();
	const prevBtcBnbPair = await updateContract.btcBnb();
	const prevWethBnbPair = await updateContract.ethBnb();
	if(prevBnbBusdPair !== bnbBusdPair || prevBtcBnbPair !== btcBnbPair|| prevWethBnbPair !== wethBnbPair)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setPairs(${bnbBusdPair}, ${wethBnbPair}, ${btcBnbPair})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setPairs(bnbBusdPair, wethBnbPair, btcBnbPair)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setPairs(${bnbBusdPair}, ${wethBnbPair}, ${btcBnbPair})\x1B[0m ...`);
	}
}


export async function CallAddLiquidity(hre: HardhatRuntimeEnvironment, contract: string, routerAddress: string, tokenA: any, tokenB: any, tokenAAmount: number, tokenBAmount: number)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const artifactName = getArtifactName(contract);
	const updateContract = await ethers.getContractAt(artifactName, routerAddress);
	const deadline = new Date(Date.now()).getTime() + 10000;
	const tokenAAmountBN = convertToEther(tokenAAmount, tokenA.decimals);
	const tokenBAmountBN = convertToEther(tokenBAmount, tokenB.decimals);

	const { uniswapV2Factory } = await GetTokenAddress();
	const factory = await ethers.getContractAt("PancakeFactory",uniswapV2Factory);
	const pairAddr = await factory.getPair(tokenA.address,tokenB.address);

	let shouldAddLiq = false;
	if(pairAddr!== AddressZero)
	{
		const pairERC20 = await ethers.getContractAt("ERC20", pairAddr);
		const balance = await pairERC20.balanceOf(deployer);
		if(!balance.gt(0))
		{
			shouldAddLiq = true;
		}
	}
	else
	{
		shouldAddLiq = true;
	}
	if(shouldAddLiq)
	{
		await CallApprove(hre, tokenA.contractName, tokenA.address, routerAddress, tokenAAmount, tokenA.decimals);
		await CallApprove(hre, tokenB.contractName, tokenB.address, routerAddress, tokenBAmount, tokenB.decimals);
	
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.addLiquidity(${tokenA.address}, ${tokenB.address}, ${tokenAAmountBN}, ${tokenBAmountBN}, 0, 0, ${deployer}, ${deadline})\x1B[0m ...`);
		await (await updateContract.connect(depSign).addLiquidity(tokenA.address, tokenB.address, tokenAAmountBN, tokenBAmountBN, 0, 0, deployer, deadline)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already added. Skip \x1B[33m${contract}.addLiquidity(${tokenA.address}, ${tokenB.address}, ${tokenAAmountBN}, ${tokenBAmountBN},0 , 0,${deployer}, ${deadline})\x1B[0m ...`);
	}	
}


export async function CallWethDeposit(hre: HardhatRuntimeEnvironment, weth: any, amount: number)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const contract = "WETH";
	const artifactName = getArtifactName(contract);
	const updateContract = await ethers.getContractAt(artifactName, weth.address);

	const balance = await updateContract.balanceOf(deployer);
	if(balance.lt(convertToEther(1, weth.decimals)))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.deposit(${amount})\x1B[0m ...`);
		await (await updateContract.connect(depSign).deposit({ value: ethers.utils.parseEther(amount.toString()) })).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.deposit(${amount})\x1B[0m ...`);
	}
}

export async function CallSetSecondaryPriceFeed(hre: HardhatRuntimeEnvironment, contract: string, address: string)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const updateContract = await getContract(hre, contract);
	const secondaryPriceFeedAddress = await updateContract.secondaryPriceFeed();

	if(secondaryPriceFeedAddress !== address)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setSecondaryPriceFeed("${address}")\x1B[0m ...`);
		await (await updateContract.connect(depSign).setSecondaryPriceFeed(address)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setSecondaryPriceFeed(${address})\x1B[0m ...`);
	}
}


export async function CallApprove(hre: HardhatRuntimeEnvironment, contract: string, tokenAddress: string, spender: string, amount: number, decimals: number)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const artifactName = getArtifactName(contract);
	const updateContract = await ethers.getContractAt(artifactName, tokenAddress);

	const amountBN = convertToEther(amount, decimals);
	const allowance = await updateContract.allowance(deployer, spender);
	if(allowance.lt(amountBN))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.approve("${spender}", "${amountBN}")\x1B[0m ...`);
		await (await updateContract.connect(depSign).approve(spender, amountBN)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.approve(${spender}, ${amountBN})\x1B[0m ...`);
	}
}

export async function CallSetFees(hre: HardhatRuntimeEnvironment, contract: string, feeParams: any)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const vaultContract = await getContract(hre, "Vault");
	const vaultData = await getContract(hre, "Vault");

	const taxBasisPoints = await vaultContract.taxBasisPoints();
	const stableTaxBasisPoints = await vaultContract.stableTaxBasisPoints();
	const mintBurnFeeBasisPoints = await vaultContract.mintBurnFeeBasisPoints();
	const swapFeeBasisPoints = await vaultContract.swapFeeBasisPoints();
	const stableSwapFeeBasisPoints = await vaultContract.stableSwapFeeBasisPoints();
	const marginFeeBasisPoints = await updateContract.marginFeeBasisPoints();
	const liquidationFeeUsd = await vaultContract.liquidationFeeUsd();
	const minProfitTime = await vaultContract.minProfitTime();
	const hasDynamicFees = await vaultContract.hasDynamicFees();

	if(
		feeParams[0] != taxBasisPoints ||
		feeParams[1] != stableTaxBasisPoints || 
		feeParams[2] != mintBurnFeeBasisPoints || 
		feeParams[3] != swapFeeBasisPoints || 
		feeParams[4] != stableSwapFeeBasisPoints || 
		feeParams[5] != marginFeeBasisPoints ||  
		feeParams[6].toString() != liquidationFeeUsd.toString() ||  
		feeParams[7] != minProfitTime || 
		feeParams[8] != hasDynamicFees
	)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setFees(vault: "${vaultData.address}", fee: "${feeParams}")\x1B[0m ...`);
		await (await updateContract.connect(depSign).setFees(vaultData.address, ...feeParams)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setFees(vault: "${vaultData.address}", fee: "${feeParams}")\x1B[0m ...`);
	}
}



export async function CallSignalApprove(hre: HardhatRuntimeEnvironment, contract: string, newHandlerContractName: string, admin: string, value: string): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const newHandlerContractData = await getContractData(hre, newHandlerContractName);

	const hash = getKeccak256(
		[
			"string",
			"address",
			"address",
			"uint256",
		],[
			"approve",
			newHandlerContractData.address, // token
			admin, // spender
			value
		]
	);

	const isPending = await updateContract.connect(depSign).pendingActions(hash);

	if (!isPending)
	{
		await (await updateContract.connect(depSign).signalApprove(newHandlerContractData.address, admin, value)).wait();
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.signalApprove("${newHandlerContractData.address}", "${admin}", ${value})\x1B[0m ...`);
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.signalApprove("${newHandlerContractData.address}", "${admin}", ${value})\x1B[0m ...`);
	}
}

export async function CallSetVaultUtils(hre: HardhatRuntimeEnvironment, contract: string, vaultUtils: string): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const vaultUtilsData = await getContractData(hre, vaultUtils);
	const vaultData = await getContractData(hre, "Vault");
	const vaultContract = await getContract(hre, "Vault");

	if ((await vaultContract.vaultUtils()) !== vaultUtilsData.address)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setVaultUtils(Vault: "${vaultData.address}", VaultUtils: "${vaultUtilsData.address}")\x1B[0m ...`);
		await (await updateContract.connect(depSign).setVaultUtils(vaultData.address, vaultUtilsData.address)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setVaultUtils(Vault: "${vaultData.address}", VaultUtils: "${vaultUtilsData.address}")\x1B[0m ...`);
	}
}


export async function CallSetErrorController(hre: HardhatRuntimeEnvironment, contract: string, errors: string[])
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const vaultContractData = await getContractData(hre, "Vault");
	const vaultContract = await ethers.getContractAt("Vault", vaultContractData.address);

	const currentErrorController = await vaultContract.errorController();
	const errorController = await getContractData(hre, contract);
	if(currentErrorController !== errorController.address)
	{
		console.log(`\x1B[32mVault\x1B[0m - ✅ Call \x1B[33mVault.setErrorController("${errorController.address}")\x1B[0m ...`);
		await vaultContract.connect(depSign).setErrorController(errorController.address);	
	}
	else
	{
		console.log(`\x1B[32mVault\x1B[0m - Already set. Skip \x1B[33mVault.setErrorController(${errorController.address})\x1B[0m ...`);
	}

	const error0 = await vaultContract.errors(0);
	if(error0 === undefined || error0 === "")
	{
		const vaultErrorControllerContract = await ethers.getContractAt(contract, errorController.address);
	
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setErrors("${vaultContractData.address}")\x1B[0m ...`);
		await vaultErrorControllerContract.connect(depSign).setErrors(vaultContractData.address, errors);	
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setErrors(${vaultContractData.address}, errors...)\x1B[0m ...`);
	}
}

export async function CallSetShouldValidateIncreaseOrder(hre: HardhatRuntimeEnvironment, contract: string, value: boolean): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	if ((await updateContract.shouldValidateIncreaseOrder()) !== value)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setShouldValidateIncreaseOrder(${value})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setShouldValidateIncreaseOrder(value)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setShouldValidateIncreaseOrder(${value})\x1B[0m ...`);
	}
}

export async function CallSetReferralStorage(hre: HardhatRuntimeEnvironment, contract: string, newStorageContractName: string): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const newStorageContractData = await getContractData(hre, newStorageContractName);

	if ((await updateContract.referralStorage()) != newStorageContractData.address)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setReferralStorage("${newStorageContractData.address}")\x1B[0m ...`);
		await (await updateContract.connect(depSign).setReferralStorage(newStorageContractData.address)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setReferralStorage("${newStorageContractData.address}")\x1B[0m ...`);
	}
}

export async function CallSetKeeper(hre: HardhatRuntimeEnvironment, contract: string, newHandlerContractName: string, isContract = true): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	let keeper;

	if(isContract)
	{
		keeper = (await getContractData(hre, newHandlerContractName)).address;
	}
	else
	{
		keeper = newHandlerContractName;
	}

	if (!await updateContract.isKeeper(keeper))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setKeeper("${keeper}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setKeeper(keeper, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setKeeper("${keeper}", true)\x1B[0m ...`);
	}
}

export async function CallSetOrderKeeper(hre: HardhatRuntimeEnvironment, contract: string, newKeeperAddress: string): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	if (!await updateContract.isOrderKeeper(newKeeperAddress))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setOrderKeeper("${newKeeperAddress}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setOrderKeeper(newKeeperAddress, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setOrderKeeper("${newKeeperAddress}", true)\x1B[0m ...`);
	}
}

export async function CallAddPlugin(hre: HardhatRuntimeEnvironment, contract: string, pluginContractName: string): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const pluginData = await getContractData(hre, pluginContractName);

	if (!(await updateContract.plugins(pluginData.address)))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.addPlugin("${pluginData.address}")\x1B[0m ...`);
		await (await updateContract.connect(depSign).addPlugin(pluginData.address)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${pluginData.address}.addPlugin("${pluginData}")\x1B[0m ...`);
	}
}

export async function CallSetLiquidator(hre: HardhatRuntimeEnvironment, contract: string, newLiquidatorAddress: string): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	if (!await updateContract.isLiquidator(newLiquidatorAddress))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setLiquidator("${newLiquidatorAddress}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setLiquidator(newLiquidatorAddress, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setLiquidator("${newLiquidatorAddress}", true)\x1B[0m ...`);
	}
}

export async function CallSetLiquidatorTl(hre: HardhatRuntimeEnvironment, contract: string, vault: string, liquidator: string, isActive = true): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const vaultContract = await getContract(hre, vault);

	const liquidatorData = await getContractData(hre, liquidator);

	if (!(await vaultContract.isLiquidator(liquidatorData.address)))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setLiquidator("${vaultContract.address}", "${liquidatorData.address}", ${isActive})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setLiquidator(vaultContract.address, liquidatorData.address, isActive)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setLiquidator("${vaultContract.address}", "${liquidatorData.address}", ${isActive})\x1B[0m ...`);
	}
}

export async function CallSetGov(hre: HardhatRuntimeEnvironment, contract: string, govContractName: string, isContract = true): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	
	const updateContract = await getContract(hre, contract);
	
	let govAddr;
	if(isContract)
	{
		const govContractData = await getContractData(hre, govContractName);
		govAddr = govContractData.address;
	}
	else
	{
		govAddr = govContractName;
	}	

	if ((await updateContract.gov()) !== govAddr)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setGov("${govAddr}")\x1B[0m ...`);
		await (await updateContract.connect(depSign).setGov(govAddr)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setGov("${govAddr}")\x1B[0m ...`);
	}
}

export async function CallSetContractHandler(hre: HardhatRuntimeEnvironment, contract: string, newHandlerContractName: string, isContract = true): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	let handler;
	if(isContract)
	{
		handler = (await getContractData(hre, newHandlerContractName)).address;
	}
	else
	{
		handler = newHandlerContractName;
	}

	if (!await updateContract.isHandler(handler))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setContractHandler("${handler}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setContractHandler(handler, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setContractHandler("${handler}", true)\x1B[0m ...`);
	}
}

export async function CallSetDelayValues(hre: HardhatRuntimeEnvironment, contract: string, minBlockDelayKeeper: number, minTimeDelayPublic: number, maxTimeDelay: number) : Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	const admin = await getAdmin(hre, contract);
	if(admin === deployer)
	{
		const oldMinBlockDelayKeeper = await updateContract.minBlockDelayKeeper();
		const oldMinTimeDelayPublic = await updateContract.minTimeDelayPublic();
		const oldMaxTimeDelay = await updateContract.maxTimeDelay();
		if (oldMinBlockDelayKeeper !== minBlockDelayKeeper || oldMinTimeDelayPublic !== minTimeDelayPublic || oldMaxTimeDelay !== maxTimeDelay)
		{
			console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setDelayValues("${minBlockDelayKeeper}","${minTimeDelayPublic}","${maxTimeDelay}")\x1B[0m ...`);
			await (await updateContract.connect(depSign).setDelayValues(minBlockDelayKeeper, minTimeDelayPublic, maxTimeDelay)).wait();
		}
		else
		{
			console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setDelayValues("${minBlockDelayKeeper}","${minTimeDelayPublic}","${maxTimeDelay}")\x1B[0m ...`);
		}
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ❌ Cannot set because deployer is not admin. Skip \x1B[33m${contract}.setDelayValues(${minBlockDelayKeeper},${minTimeDelayPublic},"${maxTimeDelay}")\x1B[0m ...`);
	}
}

export async function CallSetAdmin(hre: HardhatRuntimeEnvironment, contract: string, adminAddress: string) : Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	if (await updateContract.admin() !== adminAddress)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setAdmin("${adminAddress}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setAdmin(adminAddress)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setAdmin("${adminAddress}", true)\x1B[0m ...`);
	}
}


export async function CallSignalSetHandler(hre: HardhatRuntimeEnvironment, contract: string, newHandlerContractName: string, isContract = true) : Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	let handler;
	if(isContract)
	{
		handler = (await getContractData(hre, newHandlerContractName)).address;
	}
	else
	{
		handler = newHandlerContractName;
	}
	
	if (!await updateContract.isHandler(handler))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.signalSetHandler("${handler}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).signalSetHandler(handler, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.signalSetHandler("${handler}", true)\x1B[0m ...`);
	}
}


export async function CallSignalSetHandlerTl(hre: HardhatRuntimeEnvironment, contract: string, targetContract: string, newHandlerContract: string, isActive: boolean) : Promise<void>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	const targetContractData = await getContractData(hre, targetContract);
	const newHandlerContractData = await getContractData(hre, newHandlerContract);

	const hash = getKeccak256(
		[
			"string",
			"address",
			"address",
			"bool"
		],[
			"setHandler",
			targetContractData.address,
			newHandlerContractData.address,
			isActive
		]
	);
	const alreadyPending = await updateContract.pendingActions(hash);
	if (!alreadyPending)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.signalSetHandler("${targetContractData.address}", "${newHandlerContractData.address}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).signalSetHandler(targetContractData.address, newHandlerContractData.address, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.signalSetHandler("${targetContractData.address}", "${newHandlerContractData.address}", true)\x1B[0m ...`);
	}
}

export async function CallSetHandlerTl(hre: HardhatRuntimeEnvironment, contract: string, targetContract: string, newHandlerContract: string, isActive: boolean) : Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	const targetContractData = await getContractData(hre, targetContract);
	const newHandlerContractData = await getContractData(hre, newHandlerContract);

	const hash = getKeccak256(
		[
			"string",
			"address",
			"address",
			"bool"
		],[
			"setHandler",
			targetContractData.address,
			newHandlerContractData.address,
			isActive
		]
	);
	const alreadyPending = await updateContract.pendingActions(hash);
	if (alreadyPending)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setHandler("${targetContractData.address}", "${newHandlerContractData.address}", ${isActive})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setHandler(targetContractData.address, newHandlerContractData.address, isActive)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Can't set handler. Action not signalled. Skip \x1B[33m${contract}.setHandler("${targetContractData.address}", "${newHandlerContractData.address}", ${isActive})\x1B[0m ...`);
	}
}

export async function CallSetHandler(hre: HardhatRuntimeEnvironment, contract: string, newHandlerContractName: string, isContract = true) : Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	let handler;
	if(isContract)
	{
		handler = (await getContractData(hre, newHandlerContractName)).address;
	}
	else
	{
		handler = newHandlerContractName;
	}
	
	if (!await updateContract.isHandler(handler))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setHandler("${handler}", true)\x1B[0m ...`);
		await (await updateContract.connect(depSign).setHandler(handler, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setHandler("${handler}", true)\x1B[0m ...`);
	}
}

export async function CallSetMinter(hre: HardhatRuntimeEnvironment, contract: string, newMinterContractName: string, isContract = true): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	if(isContract)
	{
		const newMinterContractData = await getContractData(hre, newMinterContractName);
	
		if (!await updateContract.isMinter(newMinterContractData.address))
		{
			console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setMinter("${newMinterContractData.address}", true)\x1B[0m ...`);
			await (await updateContract.connect(depSign).setMinter(newMinterContractData.address, true)).wait();
		}
		else
		{
			console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setMinter("${newMinterContractData.address}", true)\x1B[0m ...`);
		}	
	}
	else
	{
		if (!await updateContract.isMinter(newMinterContractName))
		{
			console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setMinter("${newMinterContractName}", true)\x1B[0m ...`);
			await (await updateContract.connect(depSign).setMinter(newMinterContractName, true)).wait();
		}
		else
		{
			console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setMinter("${newMinterContractName}", true)\x1B[0m ...`);
		}	
	}
}

export async function CallSetBonusMultiplier(hre: HardhatRuntimeEnvironment, contract: string, value: BigNumber): Promise<void>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	
	const result: BigNumber = await updateContract.bonusMultiplierBasisPoints();
	if (!value.eq(result))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setBonusMultipilier(${value})\x1B[0m ...`);
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
	console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${updateContractName}.updateLastDistributionTime()\x1B[0m ...`);
	const index = updateContractName.indexOf("[") === -1 ? undefined : updateContractName.indexOf("[");
	const artifactName = updateContractName.substring(0, index);
	const contractData = await getContractData(hre, updateContractName);
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
	const artifactName = getArtifactName(contract);
	const updateContract = await ethers.getContractAt(artifactName, tokenAddress);
	const balance = await updateContract.balanceOf(deployer);
	if(balance.lt(amountToMint))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.mintMock(${deployer}, ${amountToMint})\x1B[0m ...`);
		await (await updateContract.mockMint(deployer, amountToMint)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already minted. Skip \x1B[33m${contract}.mintMock(${deployer}, ${amountToMint})\x1B[0m ...`);
	}
}


export async function CallMint(hre: HardhatRuntimeEnvironment, contract: string, receiver: string, amountToMint: BigNumber)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	const balance = await updateContract.balanceOf(receiver);

	if(balance.lt(amountToMint))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.mint(${receiver}, ${amountToMint})\x1B[0m ...`);
		await (await updateContract.connect(depSign).mint(receiver, amountToMint)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already minted. Skip \x1B[33m${contract}.mint(${receiver}, ${amountToMint})\x1B[0m ...`);
	}
}


export async function CallSetTokensPerInterval(hre: HardhatRuntimeEnvironment, contract: string, tokensPerInterval: BigNumber)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	
	const updateContract = await getContract(hre, contract);

	const oldTokensPerInterval = await updateContract.tokensPerInterval();

	if(!oldTokensPerInterval.eq(tokensPerInterval))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setTokensPerInterval(${tokensPerInterval})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setTokensPerInterval(tokensPerInterval)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setTokensPerInterval(${tokensPerInterval})\x1B[0m ...`);
	}
}

export async function CallPriceFeedSetTokenConfig(hre: HardhatRuntimeEnvironment, contract: string, configParameters: any[])
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	const priceFeed = await updateContract.priceFeeds(configParameters[0]);
	if(priceFeed === undefined || priceFeed === AddressZero || priceFeed !== configParameters[1])
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setTokenConfig(${configParameters[0].toString()}, ${configParameters[1].toString()}, ${configParameters[2].toString()}, ${configParameters[3].toString()})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setTokenConfig(configParameters[0], configParameters[1], configParameters[2], configParameters[3])).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setTokenConfig(${configParameters[0].toString()}, ${configParameters[1].toString()}, ${configParameters[2].toString()}, ${configParameters[3].toString()})\x1B[0m ...`);
	}
	
}

export async function getContractGov(hre: HardhatRuntimeEnvironment, contract: string): Promise<string> {
	const updateContract = await getContract(hre, contract);
	const gov = await updateContract.gov();
	return gov;
}

export async function CallSignalVaultSetTokenConfig(hre: HardhatRuntimeEnvironment, contract: string, configParameters: any[])
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	const tokenItem = configParameters[0];
	const timelockData = await getContractData(hre, "Timelock");
	const timelockContract = await ethers.getContractAt("Timelock", timelockData.address);

	const hash = getKeccak256(
		[
			"string",
			"address",
			"address",
			"uint256",
			"uint256",
			"uint256",
			"uint256",
			"bool",
			"bool"
		],[
			"vaultSetTokenConfig",
			updateContract.address,
			tokenItem.address,
			tokenItem.decimals,
			tokenItem.tokenWeight,
			tokenItem.minProfitBps,
			expandDecimals(tokenItem.maxUsdgAmount,18),
			tokenItem.isStable,
			tokenItem.isShortable
		]
	);

	const actionTimestamp = await timelockContract.connect(depSign).pendingActions(hash);
	if(actionTimestamp.eq(0))
	{
		console.log(`\x1B[32mTimelock\x1B[0m - ✅ Call \x1B[33mTimelock.signalVaultSetTokenConfig(${updateContract.address}, ${tokenItem.address}, ${tokenItem.decimals}, ${tokenItem.tokenWeight}, ${tokenItem.minProfitBps}, ${expandDecimals(tokenItem.maxUsdgAmount,18)}, ${tokenItem.isStable}, ${tokenItem.isShortable})\x1B[0m ...`);
		await (await timelockContract.connect(depSign).signalVaultSetTokenConfig(
			updateContract.address, 
			tokenItem.address,  
			tokenItem.decimals, 
			tokenItem.tokenWeight, 
			tokenItem.minProfitBps,
			expandDecimals(tokenItem.maxUsdgAmount,18),
			tokenItem.isStable,
			tokenItem.isShortable
		)).wait();
	}
	else
	{
		console.log(`\x1B[32mTimelock\x1B[0m - Already set. Skip \x1B[33mTimelock.signalVaultSetTokenConfig(${updateContract.address}, ${tokenItem.address}, ${tokenItem.decimals}, ${tokenItem.tokenWeight}, ${tokenItem.minProfitBps}, ${expandDecimals(tokenItem.maxUsdgAmount,18)}, ${tokenItem.isStable}, ${tokenItem.isShortable})\x1B[0m ...`);
	}

}


export async function CallVaultSetTokenConfig(hre: HardhatRuntimeEnvironment, contract: string, configParameters: any[])
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);

	const tokenItem = configParameters[0];
	const whitelisted = await updateContract.whitelistedTokens(tokenItem.address);
	if(!whitelisted)
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setTokenConfig(${tokenItem.address}, ${tokenItem.decimals}, ${tokenItem.tokenWeight}, ${tokenItem.minProfitBps}, ${expandDecimals(tokenItem.maxUsdgAmount, 18)}, ${tokenItem.isStable}, ${tokenItem.isShortable})\x1B[0m ...`);
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
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}setTokenConfig(${tokenItem.address}, ${tokenItem.decimals}, ${tokenItem.tokenWeight}, ${tokenItem.minProfitBps}, ${expandDecimals(tokenItem.maxUsdgAmount, 18)}, ${tokenItem.isStable}, ${tokenItem.isShortable})\x1B[0m ...`);
	}
	
}

export async function CallSetLatestAnswer(hre: HardhatRuntimeEnvironment, contract: string, seedValue: number, decimals: number)
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	
	const roundData = await updateContract.latestAnswer();
	const price = convertToEther(seedValue, decimals);

	if(!roundData.eq(price))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - ✅ Call \x1B[33m${contract}.setLatestAnswer(${price})\x1B[0m ...`);
		await (await updateContract.connect(depSign).setLatestAnswer(price)).wait();	
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33m${contract}.setLatestAnswer(${price})\x1B[0m ...`);
	}
}


export async function CallTimelockSetTokenConfig(hre: HardhatRuntimeEnvironment, contract: string, configParameters: any[])
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const updateContract = await getContract(hre, contract);
	
	const timelockData = await getContractData(hre, "Timelock");
	const timelockContract = await ethers.getContractAt("Timelock", timelockData.address);
	
	const nativeToken = await getContractData(hre, configParameters[1]);

	const reader = await getContract(hre, "Reader");

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

	const isWhitelisted = await updateContract.whitelistedTokens(tokenItem.address);
	const oldTokenWeight = await updateContract.tokenWeights(tokenItem.address);
	const oldMinProfitBps = await updateContract.minProfitBasisPoints(tokenItem.address);
	const oldMaxUsdgAmount = await updateContract.maxUsdgAmounts(tokenItem.address);
	const oldBufferAmounts = await updateContract.bufferAmounts(tokenItem.address);
	const oldUsdgAmounts = await updateContract.usdgAmounts(tokenItem.address);

	if(!isWhitelisted || 
		oldTokenWeight != tokenItem.tokenWeight ||
		oldMinProfitBps != tokenItem.minProfitBps ||
		oldMaxUsdgAmount.toString() !== adjustedMaxUsdgAmount.toString() ||
		oldBufferAmounts.toString() !== adjustedBufferAmount.toString() ||
		oldUsdgAmounts.toString() !== usdgAmount.toString())
	{
		console.log(`\x1B[32mTimelock\x1B[0m - ✅ Call \x1B[33mTimelock.setTokenConfig(vault: ${updateContract.address}, token: ${tokenItem.address}, tokenWeight: ${tokenItem.tokenWeight}, minProfitBps: ${tokenItem.minProfitBps}, maxUsdgAmount: ${adjustedMaxUsdgAmount}, bufferAmount: ${adjustedBufferAmount}, usdgAmount: ${usdgAmount})\x1B[0m ...`);
		await (await timelockContract.connect(depSign).setTokenConfig(
			updateContract.address, 
			tokenItem.address,  
			tokenItem.tokenWeight, 
			tokenItem.minProfitBps, 
			adjustedMaxUsdgAmount,
			adjustedBufferAmount,
			usdgAmount
		)).wait();	
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33mTimelock.setTokenConfig(vault: ${updateContract.address}, token: ${tokenItem.address}, tokenWeight: ${tokenItem.tokenWeight}, minProfitBps: ${tokenItem.minProfitBps}, maxUsdgAmount: ${adjustedMaxUsdgAmount}, bufferAmount: ${adjustedBufferAmount}, usdgAmount: ${usdgAmount})\x1B[0m ...`);
	}
}

export async function getAdmin(hre: HardhatRuntimeEnvironment, contract: string)
{
	const updateContract = await getContract(hre, contract);
	const admin = await updateContract.admin();
	return admin;
}

export async function PrintAllAddresses(hre: HardhatRuntimeEnvironment, network: string)
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
		const contractData = await getContractData(hre, contract);
		console.log(`${data[contract]}: "${contractData.address}",`);
	}
	const tokenNames = Object.keys(tokens[network]);
	for(const token of tokenNames)
	{
		if(token === "WETH")
		{
			console.log(`NATIVE_TOKEN: "${tokens[network][token].address}",`);
		}
		else
		{
			console.log(`${token}: "${tokens[network][token].address}",`);
		}
	}
	const { multicall3 } = await GetTokenAddress();
	console.log(`Multicall: "${multicall3}"`);
}

export function convertToEther(value: number, decimals: number)
{
	return ethers.utils.parseUnits( value.toString(), decimals);
}
  
export function getKeccak256(types: string[], values: any[])
{
	return ethers.utils.solidityKeccak256(types,values);
}

export function expandDecimals(n: number, decimals: number) 
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

export function toUsd(value: number) 
{
	const normalizedValue = value * Math.pow(10, 10);
	return ethers.BigNumber.from(normalizedValue).mul(ethers.BigNumber.from(10).pow(20));
}

export async function getContractData(hre: HardhatRuntimeEnvironment, contract: string)
{
	const { deployments } = hre;
	const contractData = await deployments.get(contract);
	return contractData;
}

function getArtifactName(contract: string)
{
	const index = contract.indexOf("[") === -1 ? undefined : contract.indexOf("[");
	return contract.substring(0, index);
}

async function getContract(hre: HardhatRuntimeEnvironment, contractName: string)
{
	const artifactName = getArtifactName(contractName);
	const contractData = await getContractData(hre, contractName);
	const updateContract = await ethers.getContractAt(artifactName, contractData.address);
	return updateContract;
}