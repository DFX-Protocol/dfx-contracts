import { DeployFunction } from "hardhat-deploy/dist/types";
import { BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallMint, CallSetHandler, CallSetMinter, GetDeployedContracts, expandDecimals, CallSetTokensPerInterval, CallUpdateLastDistributionTime } from "../scripts/DeployHelper";

const contract = "EsDFX";
const contractDependencies =
	[
		contract,
		"RewardRouterV2",
		"RewardTracker[stakedDfxTracker]",
		"RewardTracker[stakedGlpTracker]",
		"RewardDistributor[stakedDfxDistributor]",
		"RewardDistributor[stakedGlpDistributor]",
		"Vester[DfxVester]",
		"Vester[GlpVester]"
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const dependencies = await GetDeployedContracts(hre, contractDependencies);

	await CallSetHandler(hre, contract, "RewardRouterV2");
	await CallSetHandler(hre, contract, "RewardTracker[stakedDfxTracker]");
	await CallSetHandler(hre, contract, "RewardTracker[stakedGlpTracker]");
	await CallSetHandler(hre, contract, "RewardDistributor[stakedDfxDistributor]");
	await CallSetHandler(hre, contract, "RewardDistributor[stakedGlpDistributor]");
	await CallSetHandler(hre, contract, "Vester[DfxVester]");
	await CallSetHandler(hre, contract, "Vester[GlpVester]");

	await CallSetMinter(hre, contract, "Vester[DfxVester]");
	await CallSetMinter(hre, contract, "Vester[GlpVester]");

	// mint esDfx for distributors
	await CallSetMinter(hre, contract, deployer, false);
	// TODO:[MAINNET] Adjust the per month value for dfx below
	await CallMint(hre, 
		contract, 
		dependencies["RewardDistributor[stakedDfxDistributor]"].address, 
		expandDecimals(50000 * 12, 18)); // ~50,000 DFX per month
	await CallUpdateLastDistributionTime(hre, "RewardDistributor[stakedDfxDistributor]", deployer);
	// TODO: Enable this after complete deployment.
	// TODO:[MAINNET] Adjust EsDFX/sec value
	// await CallSetTokensPerInterval(hre, 
	// 	"RewardDistributor[stakedDfxDistributor]", 
	// 	BigNumber.from("20667989410000000")); // 0.02066798941 esDfx per second
	
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];