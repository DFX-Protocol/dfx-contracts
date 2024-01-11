import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedInitialize, CallSetHandler } from "../scripts/DeployHelper";
import { ethers } from "hardhat";

const contract = "RewardRouterV2[GLP]";
const { AddressZero } = ethers.constants;

const contractDependencies = [
	contract,
	"GLP",
	"RewardTracker[stakedGlpTracker]",
	"RewardTracker[feeGlpTracker]",
	"GlpManager"
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	await UnifiedInitialize(hre, contract,
		[
			AddressZero, // DFX
			AddressZero, // EsDFX
			AddressZero, // BnDFX
			dependencies["GLP"].address,
			dependencies["GlpManager"].address,
			[
				AddressZero, // RewardTracker[StakedGlpTracker]
				dependencies["RewardTracker[stakedGlpTracker]"].address,
				AddressZero, // RewardTracker[feeDfxTracker]
				dependencies["RewardTracker[feeGlpTracker]"].address,
				AddressZero // RewardTracker[bonusDfxTracker]
			],
			[
				AddressZero, // Vester[DfxVester]
				AddressZero //Vester[GlpVester]
			]
		]);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];