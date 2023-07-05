import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, CallVaultSetTokenConfig } from "../scripts/DeployHelper";
import { tokens } from "../scripts/Constants";

const contract = "VaultPriceFeed";
const chainId = 11155111;

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
		await CallVaultSetTokenConfig(hre, contract,
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