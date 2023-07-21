import { BigNumber } from "ethers";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetBonusMultiplier, CallSetMinter, CallMint, expandDecimals, GetDeployedContracts } from "../scripts/DeployHelper";

const contract = "BonusDistributor";
const contractDependencies = [
	contract,
	"RewardTracker[bonusGmxTracker]_Init",
	"MintableBaseToken[bnGMX]"
];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const dependencies = await GetDeployedContracts(hre, contractDependencies);

	await CallSetBonusMultiplier(hre, contract, BigNumber.from(10000));
	// mint bnGmx for distributor
	await CallSetMinter(hre, "MintableBaseToken[bnGMX]", deployer, false);
	// TODO: Change minting value on mainnet
	await CallMint(hre, "MintableBaseToken[bnGMX]", dependencies[contract].address, expandDecimals(15 * 1000 * 1000, 18));
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];