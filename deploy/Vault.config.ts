import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, CallTimelockSetTokenConfig, CallSignalVaultSetTokenConfig, CallSetGov, CallVaultSetTokenConfig, CallSetLatestAnswer } from "../scripts/DeployHelper";
import { tokens, chainConfig } from "../config/Constants";

const contract = "Vault";
const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const contractDependencies = [
	contract, 
	"USDG",
	"Reader",
	"Timelock_Init",
	"Vault_Init",
	"VaultPriceFeed_Init",
	"VaultErrorController_Init"
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const tokenNames = Object.keys(tokens[chainId]);
	// Set Token price through PriceFeed contract
	if(!chainConfig[chainId].isOracleAvailable)
	{
		for(const token of tokenNames)
		{
			await CallSetLatestAnswer(hre, tokens[chainId][token].priceFeed, tokens[chainId][token].price, tokens[chainId][token].priceDecimals);
		}
	}
	// Signal Vault SetTokenConfig
	for(const token of tokenNames)
	{
		await CallSignalVaultSetTokenConfig(hre, contract,
			[
				tokens[chainId][token]
			]);
	}
	// Whitelist tokens
	for(const token of tokenNames)
	{
		await CallVaultSetTokenConfig(
			hre, 
			contract, 
			[tokens[chainId][token]]
		);
	}
	// Make timelock as gov of vault
	await CallSetGov(hre, "Vault", "Timelock");
	// Add token configs using timelock
	for(const token of tokenNames)
	{
		await CallTimelockSetTokenConfig(hre, contract,
			[
				chainId,
				tokens[chainId].WETH.contractName, // TODO: Dynamically send native token address
				dependencies[contract].address,
				tokens[chainId][token].address,
				tokens[chainId][token],
			]);
	}
};

export default func;

func.id = `Deploy_${contract}_Config`; // id required to prevent reexecution
func.tags = [`${contract}_Config`, "testnet"];
func.dependencies = [...contractDependencies];