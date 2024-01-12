import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedInitialize, CallSetHandler } from "../scripts/DeployHelper";
import { ethers } from "hardhat";

const contract = "RewardRouterV2[DLP]";
const { AddressZero } = ethers.constants;

const contractDependencies = [
	contract,
	"DLP",
	"RewardTracker[stakedDlpTracker]",
	"RewardTracker[feeDlpTracker]",
	"DlpManager"
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			AddressZero, // DFX
			AddressZero, // EsDFX
			AddressZero, // BnDFX
			dependencies["DLP"].address,
			dependencies["DlpManager"].address,
			[
				AddressZero, // RewardTracker[StakedDlpTracker]
				dependencies["RewardTracker[stakedDlpTracker]"].address,
				AddressZero, // RewardTracker[feeDfxTracker]
				dependencies["RewardTracker[feeDlpTracker]"].address,
				AddressZero // RewardTracker[bonusDfxTracker]
			],
			[
				AddressZero, // Vester[DfxVester]
				AddressZero //Vester[DlpVester]
			]
		]);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];