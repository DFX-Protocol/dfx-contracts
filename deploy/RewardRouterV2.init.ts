import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "RewardRouterV2";
const contractDependencies = [
	contract,
	"DFX",
	"EsDFX",
	"MintableBaseToken[bnDFX]",
	"GLP",
	"RewardTracker[stakedDfxTracker]",
	"RewardTracker[stakedGlpTracker]",
	"RewardTracker[bonusDfxTracker]",
	"RewardTracker[feeDfxTracker]",
	"RewardTracker[feeGlpTracker]",
	"GlpManager",
	"Vester[DfxVester]",
	"Vester[GlpVester]"
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			dependencies["DFX"].address,
			dependencies["EsDFX"].address,
			dependencies["MintableBaseToken[bnDFX]"].address,
			dependencies["GLP"].address,
			dependencies["GlpManager"].address,
			[
				dependencies["RewardTracker[stakedDfxTracker]"].address,
				dependencies["RewardTracker[stakedGlpTracker]"].address,
				dependencies["RewardTracker[feeDfxTracker]"].address,
				dependencies["RewardTracker[feeGlpTracker]"].address,
				dependencies["RewardTracker[bonusDfxTracker]"].address
			],
			[
				dependencies["Vester[DfxVester]"].address,
				dependencies["Vester[GlpVester]"].address
			]
		]);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];