import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallMockMint, convertToEther } from "../scripts/DeployHelper";
import { BigNumber } from "ethers";
import { tokens } from "../config/Constants";

const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const contract = "ERC20Mock[BUSD]";
const contractDependencies =
	[
		contract,
	];
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(tokens[chainId].BUSD !== null && tokens[chainId].BUSD !== undefined)
	{
		const amountToMint: BigNumber = convertToEther(tokens[chainId].BUSD.mintAmount, tokens[chainId].BUSD.decimals);
		await CallMockMint(hre, contract, tokens[chainId].BUSD.address, amountToMint);
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