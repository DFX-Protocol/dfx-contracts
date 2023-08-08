import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { tokens } from "../config/Constants";
import { 
	GetDeployedContracts, 
	CallSetSecondaryPriceFeed, 
	UnifiedInitialize, 
	CallFastPriceFeedSetTokens, 
	CallSetVaultPriceFeed, 
	CallSetMaxTimeDeviation,
	CallSetSpreadBasisPointsIfInactive,
	CallSetSpreadBasisPointsIfChainError,
	CallSetMaxCumulativeDeltaDiffs,
	CallSetPriceDataInterval,
	CallSetPositionKeeper,
	CallSetIsPriceFeed,
	CallSetTokenManager,
	CallSetFastPriceEvents } from "../scripts/DeployHelper";

const contract = "FastPriceFeed";
const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const contractDependencies =
	[
		contract,
		"FastPriceEvents",
		"VaultPriceFeed",
		"PositionRouter",
		"TokenManager"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const dependencies = await GetDeployedContracts(hre, contractDependencies);

	await CallSetSecondaryPriceFeed(hre, "VaultPriceFeed", dependencies[contract].address);
	// updaters here are keepers. But these keepers are not position/order/liquidation/ShortsTracker/OpenInterest keepers but price feed keepers
	// Note: The price feed keepers are not being used anymore
	const { signer1, signer2, signer3, signer4, signer5, signer6, updater1, updater2, updater3, updater4 } = await getNamedAccounts();

	const initParameters =
	[
		1,
		[
			signer1,
			signer2,
			signer3,
			signer4,
			signer5,
			signer6
		],
		[
			updater1,
			updater2,
			updater3,
			updater4
		]
	];
	await UnifiedInitialize(hre, contract, initParameters);

	const tokensArr = [];
	const precisionArr = [];
	const maxCumulativeDeltaDiffArr = [];
	const tokenNames = Object.keys(tokens[chainId]);

	for(const token of tokenNames)
	{
		if(!tokens[chainId][token].isStable)
		{
			tokensArr.push(tokens[chainId][token].address);
			precisionArr.push(tokens[chainId][token].fastPricePrecision);
			maxCumulativeDeltaDiffArr.push(tokens[chainId][token].maxCumulativeDeltaDiff);
		}
	}
	
	await CallFastPriceFeedSetTokens(hre, contract, tokensArr, precisionArr);
	await CallSetVaultPriceFeed(hre, contract, dependencies["VaultPriceFeed"].address);
	await CallSetMaxTimeDeviation(hre, contract, 60 * 60);
	await CallSetSpreadBasisPointsIfInactive(hre, contract, 50);
	await CallSetSpreadBasisPointsIfChainError(hre, contract, 500);
	await CallSetMaxCumulativeDeltaDiffs(hre, contract, tokensArr, maxCumulativeDeltaDiffArr);
	await CallSetPriceDataInterval(hre, contract, 1 * 60);
	// TODO: GMX has 2 position keepers. Why? Investigate
	await CallSetPositionKeeper(hre, "PositionRouter", dependencies[contract].address, true);
	await CallSetIsPriceFeed(hre, "FastPriceEvents", dependencies[contract].address,true);
	await CallSetFastPriceEvents(hre, contract, dependencies["FastPriceEvents"].address);
	// TODO: Might have to add following transaction if using timelock properly everywhere
	// await sendTxn(secondaryPriceFeed.setGov(priceFeedTimelock.address), "secondaryPriceFeed.setGov")
	await CallSetTokenManager(hre, contract, dependencies["TokenManager"].address);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];