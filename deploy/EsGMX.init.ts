import { DeployFunction } from "hardhat-deploy/dist/types";
import { BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallMint, CallSetHandler, CallSetMinter, GetDeployedContracts, expandDecimals, CallSetTokensPerInterval, CallUpdateLastDistributionTime } from "../scripts/DeployHelper";

const contract = "EsGMX";
const contractDependencies =
	[
		contract,
		"RewardRouterV2",
		"RewardTracker[stakedGmxTracker]",
		"RewardTracker[stakedGlpTracker]",
		"RewardDistributor[stakedGmxDistributor]",
		"RewardDistributor[stakedGlpDistributor]",
		"Vester[GmxVester]",
		"Vester[GlpVester]"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const dependencies = await GetDeployedContracts(hre, contractDependencies);

	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "RewardTracker[stakedGmxTracker]");
	await CallSetHandler(hre, contract, "RewardTracker[stakedGlpTracker]");
	await CallSetHandler(hre, contract, "RewardDistributor[stakedGmxDistributor]");
	await CallSetHandler(hre, contract, "RewardDistributor[stakedGlpDistributor]");
	await CallSetHandler(hre, contract, "Vester[GmxVester]");
	await CallSetHandler(hre, contract, "Vester[GlpVester]");

	await CallSetMinter(hre, contract, "Vester[GmxVester]");
	await CallSetMinter(hre, contract, "Vester[GlpVester]");

	// mint esGmx for distributors
	await CallSetMinter(hre, contract, deployer, false);
	// TODO:[MAINNET] Adjust the per month value for gmx below
	await CallMint(hre, 
		contract, 
		dependencies["RewardDistributor[stakedGmxDistributor]"].address, 
		expandDecimals(50000 * 12, 18)); // ~50,000 GMX per month
	await CallUpdateLastDistributionTime(hre, "RewardDistributor[stakedGmxDistributor]", deployer);
	// TODO: Enable this after complete deployment.
	// TODO:[MAINNET] Adjust EsGMX/sec value
	// await CallSetTokensPerInterval(hre, 
	// 	"RewardDistributor[stakedGmxDistributor]", 
	// 	BigNumber.from("20667989410000000")); // 0.02066798941 esGmx per second
	
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];