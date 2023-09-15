import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetMaxStrictPriceDeviation, getPairAddress, CallSetPriceSampleSpace, CallSetIsChainlinkEnabled, CallPriceFeedSetTokenConfig, CallSetPairs, CallAddLiquidity, CallCreatePair, CallSetIsAmmEnabled, expandDecimals, CallWethDeposit } from "../scripts/DeployHelper";
import { GetTokenAddress } from "../config/DeployConstants";
import { tokens, chainConfig, tokenPairs } from "../config/Constants";
import { BigNumber } from "ethers";

const contract = "VaultPriceFeed";
const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";
const baseLiquidity = 1000;

const contractDependencies = [
	contract
];

interface TokenWithPairs {
	Token: string,
	Pairs: string[]
}

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	// Enable chainlink when either chainlink oracles are available on given chain or if we are deploying our own oracles manually
	if(!chainConfig[chainId].shouldConfigOracle && !chainConfig[chainId].isOracleAvailable)
	{
		await CallSetIsChainlinkEnabled(hre, contract, false);
	}
	
	const tokenNames = Object.keys(tokens[chainId]);
	if(chainConfig[chainId].isAmmEnabled)
	{
		await CallSetIsAmmEnabled(hre, contract, chainConfig[chainId].isAmmEnabled);
		
		const { uniswapV2Factory } = await GetTokenAddress();
		const { uniswapV2Router } = await GetTokenAddress();
		const baseTokenKeys = Object.keys(tokenPairs[chainId]);

		if(chainConfig[chainId].isTestnet)
		{	
			// Create pairs of each base token with all of its quote tokens on all given DEXs
			for(let dex = 0; dex < uniswapV2Factory.length; dex++)
			{
				for(const baseToken of baseTokenKeys)
				{
					const quoteTokens = tokenPairs[chainId][baseToken];
	
					for( let i = 0; i < quoteTokens.length; i++)
					{
						await CallCreatePair(hre, "PancakeFactory", uniswapV2Factory[dex], tokens[chainId][baseToken].address, tokens[chainId][quoteTokens[i]].address);
					}
				}
			}
		}

		// create objects of all base tokens with their pairs
		const tokenWithPairs: TokenWithPairs[] = [];
		for(let dex = 0; dex < uniswapV2Factory.length; dex++)
		{
			for(const baseToken of baseTokenKeys)
			{
				const pairs: string[] = [];
				const quoteTokens = tokenPairs[chainId][baseToken];
	
				for( let i = 0; i < quoteTokens.length; i++)
				{
					const pairAddr = await getPairAddress("PancakeFactory", uniswapV2Factory[dex], tokens[chainId][baseToken].address, tokens[chainId][quoteTokens[i]].address);
					pairs.push(pairAddr);
				}
	
				tokenWithPairs.push({Token: tokens[chainId][baseToken].address, Pairs: pairs} as TokenWithPairs);
			}	
		}

		for(let i = 0; i < tokenWithPairs.length; i++)
		{
			await CallSetPairs(hre, contract, tokenWithPairs[i].Token, tokenWithPairs[i].Pairs);
		}

		// Only add liquidity when its testnet
		if(chainConfig[chainId].isTestnet && chainConfig[chainId].shouldAddLiquidity)
		{
			for(let dex = 0; dex < uniswapV2Router.length; dex++)
			{
				// Add liquidity for all the token pairs
				for(const baseToken of baseTokenKeys)
				{
					const quoteTokens = tokenPairs[chainId][baseToken];
					// Exclude WETH when adding liquidity
					if(baseToken != "WETH")
					{
						for( let i = 0; i < quoteTokens.length; i++)
						{
							await CallAddLiquidity(hre, 
								"PancakeRouter", 
								uniswapV2Router[dex], 
								"PancakeFactory", 
								uniswapV2Factory[dex], 
								tokens[chainId][baseToken], 
								tokens[chainId][quoteTokens[i]], 
								baseLiquidity * tokens[chainId][quoteTokens[i]].price, 
								baseLiquidity * tokens[chainId][baseToken].price
							);
						}	
					} 
					else 
					{
						for( let i = 0; i < quoteTokens.length; i++)
						{
							const wethLiq = 1;
							await CallWethDeposit(hre, tokens[chainId].WETH, wethLiq * tokens[chainId][quoteTokens[i]].price);
							await CallAddLiquidity(hre, 
								"PancakeRouter", 
								uniswapV2Router[dex], 
								"PancakeFactory", 
								uniswapV2Factory[dex], 
								tokens[chainId][baseToken], 
								tokens[chainId][quoteTokens[i]], 
								wethLiq * tokens[chainId][quoteTokens[i]].price,  // Add 1ETH base liquidity for WETH in testnet to save precious ETH! 
								wethLiq * tokens[chainId][baseToken].price
							);
						}
					}
				}	
			}
		}
	}
	else
	{
		await CallSetIsAmmEnabled(hre, contract, chainConfig[chainId].isAmmEnabled);
	}
	await CallSetMaxStrictPriceDeviation(hre, contract, expandDecimals(1, 28)); // 0.01 USD

	if(chainConfig[chainId].isOracleAvailable)
	{
		await CallSetPriceSampleSpace(hre, contract, BigNumber.from(1));
	}
	
	for(const token of tokenNames)
	{
		await CallPriceFeedSetTokenConfig(hre, contract,
			[
				tokens[chainId][token].address,
				tokens[chainId][token].priceFeed,
				tokens[chainId][token].priceDecimals,
				tokens[chainId][token].isStrictStable	
			]);
	}
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet"];
func.dependencies = [...contractDependencies];