import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import { tokens } from "../config/Constants";
import { ethers } from "hardhat";

const { AddressZero } = ethers.constants;

const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const contract = "ERC20Mock[BUSD]";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(tokens[chainId].BUSD !== null && tokens[chainId].BUSD !== undefined)
	{
		if(tokens[chainId].BUSD.address === AddressZero || tokens[chainId].BUSD.address === undefined)
		{
			const constructorParameters = ["Binance USD","BUSD"];
			await UnifiedDeploy(hre, contract, constructorParameters);
		}
		else
		{
			console.log(`\x1B[32m${contract}\x1B[0m - reused at ${tokens[chainId].BUSD.address}\x1B[0m ...`);
		}
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Cannot deploy ${contract} because it's not set in tokens constants\x1B[0m ...`);
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "mockTokens"];
