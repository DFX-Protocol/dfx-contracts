import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, CallTimelockSetTokenConfig, CallSignalVaultSetTokenConfig, CallSetGov, CallVaultSetTokenConfig, CallSetLatestAnswer, CallSetLiquidator, CallSetVaultUtils, CallSetFees, toUsd, CallPriceFeedSetTokenConfig } from "../scripts/DeployHelper";
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
	"VaultErrorController_Init",
	"VaultPriceFeed",
	"PositionManager",
	"VaultUtils"
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
	
	// Whitelist tokens
	for(const token of tokenNames)
	{
		// TODO: CallVaultSetTokenConfig failes because the VaultPriceFeed.getPrice method called by the Vault expects the Tokens to be set already.
		// TODO: Run again when set...
		// await CallVaultSetTokenConfig(
		// 	hre, 
		// 	contract, 
		// 	[tokens[chainId][token]]
		// );
	}
	// Make timelock as gov of vault
	await CallSetLiquidator(hre, contract, "PositionManager");
	await CallSetVaultUtils(hre, contract, "VaultUtils");
	await CallSetGov(hre, "Vault", "Timelock");

	// Signal Vault SetTokenConfig
	for(const token of tokenNames)
	{
		await CallSignalVaultSetTokenConfig(hre, contract,
			[
				tokens[chainId][token]
			]);
	}

	// TODO:[MAINNET] Update following params
	// Basis point parameters below has a precision of 2. For example: 50 means 0.5%
	const feeParams = [
		50, // _taxBasisPoints
		5, // _stableTaxBasisPoints
		25, // _mintBurnFeeBasisPoints
		30, // _swapFeeBasisPoints
		1, // _stableSwapFeeBasisPoints
		10, // _marginFeeBasisPoints
		toUsd(5), // _liquidationFeeUsd
		3 * 60 * 60, // _minProfitTime
		true // _hasDynamicFees
	];
	await CallSetFees(hre, "Timelock", feeParams);
	// Add token configs using timelock
	for(const token of tokenNames)
	{
		await CallTimelockSetTokenConfig(hre, contract,
			[
				chainId,
				tokens[chainId].WETH.address, // TODO: Dynamically send native token address
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