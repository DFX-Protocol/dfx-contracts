import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, CallSetTokenConfig } from "../scripts/DeployHelper";
import { tokens } from "../scripts/Constants";

const contract = "Vault";
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
	tokens[chainId].WETH.priceFeedContractName,
	"USDG",
	"Reader",
	"Timelock_Init",
	"Vault_Init"
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const tokenNames = Object.keys(tokens[chainId]);
	for(const token of tokenNames)
	{
		await CallSetTokenConfig(hre, contract,
			[
				chainId,
				tokens[chainId].WETH.contractName, // TODO: Dynamically send native token address
				dependencies[contract].address,
				dependencies[tokens[chainId][token].contractName].address,
				tokens[chainId][token],
			]);
	}
};

export default func;

func.id = `Deploy_${contract}_Config`; // id required to prevent reexecution
func.tags = [`${contract}_Config`, "testnet"];
func.dependencies = [...contractDependencies];