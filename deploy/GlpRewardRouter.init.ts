import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";
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
			AddressZero, // GMX
			AddressZero, // EsGMX
			AddressZero, // BnGMX
			dependencies["GLP"].address,
			dependencies["GlpManager"].address,
			[
				AddressZero, // RewardTracker[StakedGlpTracker]
				dependencies["RewardTracker[stakedGlpTracker]"].address,
				AddressZero, // RewardTracker[feeGmxTracker]
				dependencies["RewardTracker[feeGlpTracker]"].address,
				AddressZero // RewardTracker[bonusGmxTracker]
			],
			[
				AddressZero, // Vester[GmxVester]
				AddressZero //Vester[GlpVester]
			]
		]);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];