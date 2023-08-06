import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, CallTimelockSetTokenConfig, CallSignalVaultSetTokenConfig, CallSetGov, CallVaultSetTokenConfig, CallSetLatestAnswer } from "../scripts/DeployHelper";
import { tokens } from "../config/Constants";

const contract = "Vault";
const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

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
	"Vault_Init",
	"VaultPriceFeed_Init",
	"VaultErrorController_Init"
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const tokenNames = Object.keys(tokens[chainId]);
	// Set Token price through PriceFeed contract
	// TODO: This should STRICTLY happen in testnet
	for(const token of tokenNames)
	{
		await CallSetLatestAnswer(hre, tokens[chainId][token].priceFeedContractName, tokens[chainId][token].price, tokens[chainId][token].priceDecimals);
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
				dependencies[tokens[chainId][token].contractName].address,
				tokens[chainId][token],
			]);
	}
};

export default func;

func.id = `Deploy_${contract}_Config`; // id required to prevent reexecution
func.tags = [`${contract}_Config`, "testnet"];
func.dependencies = [...contractDependencies];