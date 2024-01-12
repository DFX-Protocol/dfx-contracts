import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "RewardRouterV2";
const contractDependencies = [
	contract,
	"DFX",
	"EsDFX",
	"MintableBaseToken[bnDFX]",
	"DLP",
	"RewardTracker[stakedDfxTracker]",
	"RewardTracker[stakedDlpTracker]",
	"RewardTracker[bonusDfxTracker]",
	"RewardTracker[feeDfxTracker]",
	"RewardTracker[feeDlpTracker]",
	"DlpManager",
	"Vester[DfxVester]",
	"Vester[DlpVester]"
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			dependencies["DFX"].address,
			dependencies["EsDFX"].address,
			dependencies["MintableBaseToken[bnDFX]"].address,
			dependencies["DLP"].address,
			dependencies["DlpManager"].address,
			[
				dependencies["RewardTracker[stakedDfxTracker]"].address,
				dependencies["RewardTracker[stakedDlpTracker]"].address,
				dependencies["RewardTracker[feeDfxTracker]"].address,
				dependencies["RewardTracker[feeDlpTracker]"].address,
				dependencies["RewardTracker[bonusDfxTracker]"].address
			],
			[
				dependencies["Vester[DfxVester]"].address,
				dependencies["Vester[DlpVester]"].address
			]
		]);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];