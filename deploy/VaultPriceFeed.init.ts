import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, CallPriceFeedSetTokenConfig, CallSetTokens, CallSetPairs, CallApprove, CallAddLiquidity } from "../scripts/DeployHelper";
import { GetTokenAddress } from "../scripts/DeployConstants";
import { tokens } from "../scripts/Constants";

const contract = "VaultPriceFeed";
const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

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

	// await CallCreatePair(hre, "PancakeFactory", uniswapV2Factory, bnb, busd);
	// await CallCreatePair(hre, "PancakeFactory", uniswapV2Factory, weth, bnb);
	// await CallCreatePair(hre, "PancakeFactory", uniswapV2Factory, btc, bnb);

	await CallSetPairs(hre, contract,
		"PancakeFactory",
		uniswapV2Factory,
		bnb,
		busd,
		btc,
		weth
	);
	// TODO: Check if pairs already exist and has some liquidity token(UNISWAP-V2 token) in deployer's address, then don't run below scripts
	await CallApprove(hre, tokens[chainId].BNB.contractName, bnb, uniswapV2Router, 100, tokens[chainId].BNB.decimals);
	await CallApprove(hre, tokens[chainId].BUSD.contractName, busd, uniswapV2Router, 24353.91, tokens[chainId].BUSD.decimals);
	await CallAddLiquidity(hre, "PancakeRouter", uniswapV2Router, bnb, busd, 100, 24353.91, tokens[chainId].BNB.decimals, tokens[chainId].BUSD.decimals);

	await CallApprove(hre, tokens[chainId].WETH.contractName, weth, uniswapV2Router, 1, tokens[chainId].WETH.decimals);
	await CallApprove(hre, tokens[chainId].BNB.contractName, bnb, uniswapV2Router, 7.9586, tokens[chainId].BNB.decimals);
	await CallAddLiquidity(hre, "PancakeRouter", uniswapV2Router, weth, bnb, 1, 7.9586, tokens[chainId].WETH.decimals, tokens[chainId].BNB.decimals);
	
	await CallApprove(hre, tokens[chainId].BTC.contractName, btc, uniswapV2Router, 100, tokens[chainId].BTC.decimals);
	await CallApprove(hre, tokens[chainId].BNB.contractName, bnb, uniswapV2Router, 12748, tokens[chainId].BNB.decimals);
	await CallAddLiquidity(hre, "PancakeRouter", uniswapV2Router, btc, bnb, 100, 12748, tokens[chainId].BTC.decimals, tokens[chainId].BNB.decimals);

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