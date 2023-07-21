import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, CallPriceFeedSetTokenConfig, CallSetTokens, CallSetPairs, CallWethDeposit, CallAddLiquidity, CallCreatePair } from "../scripts/DeployHelper";
import { GetTokenAddress } from "../scripts/DeployConstants";
import { tokens } from "../scripts/Constants";

const contract = "VaultPriceFeed";
const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const bnbBusdLPrice = 236.50233007902;
const wethBnbPrice = 7.97;
const btcBnbPrice = 129.05;

const bnbBusdLiq = 10000;
const wethBnbLiq = 1;
const btcBnbLiq = 100;

const contractDependencies = [
	contract, 
	tokens[chainId].USDT.contractName,
	tokens[chainId].USDT.contractName.concat("_Init"),
	tokens[chainId].USDT.priceFeedContractName,
	tokens[chainId].BTC.contractName,
	tokens[chainId].BTC.contractName.concat("_Init"),
	tokens[chainId].BTC.priceFeedContractName,
	tokens[chainId].BNB.contractName,
	tokens[chainId].BNB.contractName.concat("_Init"),
	tokens[chainId].BNB.priceFeedContractName,
	tokens[chainId].BUSD.contractName.concat("_Init"),
	tokens[chainId].BUSD.contractName,
	tokens[chainId].BUSD.priceFeedContractName,
	tokens[chainId].WETH.contractName.concat("_Init"),
	tokens[chainId].WETH.contractName,
	tokens[chainId].WETH.priceFeedContractName,
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const tokenNames = Object.keys(tokens[chainId]);
	
	await CallSetTokens(hre, contract, 
		tokens[chainId].BTC.address,
		tokens[chainId].WETH.address,
		tokens[chainId].BNB.address
	);

	const bnb = tokens[chainId].BNB.address;
	const busd = tokens[chainId].BUSD.address;
	const btc = tokens[chainId].BTC.address;
	const weth = tokens[chainId].WETH.address;

	const { uniswapV2Factory } = await GetTokenAddress();
	const { uniswapV2Router } = await GetTokenAddress();

	await CallCreatePair(hre, "PancakeFactory", uniswapV2Factory, bnb, busd);
	await CallCreatePair(hre, "PancakeFactory", uniswapV2Factory, weth, bnb);
	await CallCreatePair(hre, "PancakeFactory", uniswapV2Factory, btc, bnb);

	await CallSetPairs(hre, contract,
		"PancakeFactory",
		uniswapV2Factory,
		bnb,
		busd,
		btc,
		weth
	);

	await CallAddLiquidity(hre, "PancakeRouter", uniswapV2Router, tokens[chainId].BNB, tokens[chainId].BUSD, bnbBusdLiq, bnbBusdLiq * bnbBusdLPrice);

	await CallWethDeposit(hre, tokens[chainId].WETH, wethBnbLiq);
	await CallAddLiquidity(hre, "PancakeRouter", uniswapV2Router, tokens[chainId].WETH, tokens[chainId].BNB, wethBnbLiq, wethBnbLiq * wethBnbPrice);
	
	await CallAddLiquidity(hre, "PancakeRouter", uniswapV2Router, tokens[chainId].BTC, tokens[chainId].BNB, btcBnbLiq, btcBnbLiq * btcBnbPrice);

	for(const token of tokenNames)
	{
		await CallPriceFeedSetTokenConfig(hre, contract,
			[
				tokens[chainId][token].address,
				dependencies[tokens[chainId][token].priceFeedContractName].address,
				tokens[chainId][token].decimals,
				tokens[chainId][token].isStrictStable	
			]);
	}
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet"];
func.dependencies = [...contractDependencies];