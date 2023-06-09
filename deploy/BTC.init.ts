import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallMockMint } from "../scripts/DeployHelper";
import { BigNumber } from "ethers";
import { tokens } from "../scripts/Constants";

const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const contract = "ERC20Mock[BTC]";

const contractDependencies =
	[
		contract,
	];
const amountToMint: BigNumber = BigNumber.from("1000000000000000000000"); // 1000 BTC
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await CallMockMint(hre, contract, tokens[chainId].BTC.address, amountToMint);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet"];
func.dependencies = [...contractDependencies];