import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallMockMint, convertToEther } from "../scripts/DeployHelper";
import { BigNumber } from "ethers";
import { tokens } from "../config/Constants";

const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const contract = "ERC20Mock[USDC]";
const contractDependencies =
	[
		contract,
	];
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(tokens[chainId].USDC !== null && tokens[chainId].USDC !== undefined)
	{
		const amountToMint: BigNumber = convertToEther(tokens[chainId].USDC.mintAmount, tokens[chainId].USDC.decimals);
		await CallMockMint(hre, contract, tokens[chainId].USDC.address, amountToMint);
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Cannot mint ${contract} because it's not set in current chain tokens constant\x1B[0m ...`);
	}
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet"];
func.dependencies = [...contractDependencies];
