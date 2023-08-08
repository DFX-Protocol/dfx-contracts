import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import { tokens } from "../config/Constants";
import { ethers } from "hardhat";

const { AddressZero } = ethers.constants;

const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";
const contract = "ERC20Mock[LINK]";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(tokens[chainId].LINK !== null && tokens[chainId].LINK !== undefined)
	{
		if(tokens[chainId].LINK.address === AddressZero || tokens[chainId].LINK.address === undefined)
		{
			const constructorParameters = ["LINK","LINK"];
			await UnifiedDeploy(hre, contract, constructorParameters);
		}
		else
		{
			console.log(`\x1B[32m${contract}\x1B[0m - reused at ${tokens[chainId].LINK.address}\x1B[0m ...`);
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
