import { BigNumber } from "ethers";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetBonusMultiplier } from "../scripts/DeployHelper";

const contract = "BonusDistributor";
const contractDependencies = [
	contract,
	"RewardTracker[bonusGmxTracker]_Init" // Modifies BonusDistributor and needs to do this before CallSetBonusMultiplier
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await CallSetBonusMultiplier(hre, contract, BigNumber.from(10000));
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`];
func.dependencies = [...contractDependencies];