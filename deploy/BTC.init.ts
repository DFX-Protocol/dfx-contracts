import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallMockMint } from "../scripts/DeployHelper";
import { BigNumber } from "ethers";

const contract = "ERC20Mock[BTC]";
const contractDependencies =
	[
		contract,
	];
const amountToMint: BigNumber = BigNumber.from("100000000000000000000"); // 100 BTC
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await CallMockMint(hre, contract, amountToMint);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`];
func.dependencies = [...contractDependencies];