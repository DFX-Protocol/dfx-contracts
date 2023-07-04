import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, CallSetTokenConfig } from "../scripts/DeployHelper";

const contract = "VaultPriceFeed";
const chainId = 11155111;
const tokens = {
	11155111:{
		USDT: {
			contractName: "ERC20Mock[USDT]",
			decimals: 18,
			isStrictStable: true,
			priceFeedContractName: "PriceFeed[USDT]"
		},
		BUSD: {
			contractName: "ERC20Mock[BUSD]",
			decimals: 18,
			isStrictStable: true,
			priceFeedContractName: "PriceFeed[BUSD]"
		},
		BTC: {
			contractName: "ERC20Mock[BTC]",
			decimals: 18,
			isStrictStable: false,
			priceFeedContractName: "PriceFeed[BTC]"
		},
		BNB: {
			contractName: "ERC20Mock[BNB]",
			decimals: 18,
			isStrictStable: false,
			priceFeedContractName: "PriceFeed[BNB]"
		},
		WETH: {
			contractName: "WETH",
			decimals: 18,
			isStrictStable: false,
			priceFeedContractName: "PriceFeed[WETH]"
		}
	}
};


const contractDependencies = [
	contract, 
	tokens[chainId].USDT.contractName,
	tokens[chainId].USDT.priceFeedContractName,
	tokens[chainId].BTC.contractName,
	tokens[chainId].BTC.priceFeedContractName,
	tokens[chainId].BNB.contractName,
	tokens[chainId].BNB.priceFeedContractName,
	tokens[chainId].BUSD.contractName,
	tokens[chainId].BUSD.priceFeedContractName,
	tokens[chainId].WETH.contractName,
	tokens[chainId].WETH.priceFeedContractName
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const tokenNames = Object.keys(tokens[chainId]);
	for(const token of tokenNames)
	{
		await CallSetTokenConfig(hre, contract,
			[
				dependencies[tokens[chainId][token].contractName].address,
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