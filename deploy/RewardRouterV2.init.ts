import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "RewardRouterV2";
const contractDependencies = [
	contract,
	"GMX",
	"EsGMX",
	"MintableBaseToken[bnGMX]",
	"GLP",
	"RewardTracker[stakedGmxTracker]",
	"RewardTracker[stakedGlpTracker]",
	"RewardTracker[bonusGmxTracker]",
	"RewardTracker[feeGmxTracker]",
	"RewardTracker[feeGlpTracker]",
	"GlpManager",
	"Vester[GmxVester]",
	"Vester[GlpVester]"
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			dependencies["GMX"].address,
			dependencies["EsGMX"].address,
			dependencies["MintableBaseToken[bnGMX]"].address,
			dependencies["GLP"].address,
			dependencies["GlpManager"].address,
			[
				dependencies["RewardTracker[stakedGmxTracker]"].address,
				dependencies["RewardTracker[stakedGlpTracker]"].address,
				dependencies["RewardTracker[feeGmxTracker]"].address,
				dependencies["RewardTracker[feeGlpTracker]"].address,
				dependencies["RewardTracker[bonusGmxTracker]"].address
			],
			[
				dependencies["Vester[GmxVester]"].address,
				dependencies["Vester[GlpVester]"].address
			]
		]);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];