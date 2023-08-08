import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import { tokens } from "../config/Constants";
import { ethers } from "hardhat";

const { AddressZero } = ethers.constants;

const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";
const contract = "ERC20Mock[DAI]";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(tokens[chainId].DAI !== null && tokens[chainId].DAI !== undefined)
	{
		if(tokens[chainId].DAI.address === AddressZero || tokens[chainId].DAI.address === undefined)
		{
			const constructorParameters = ["DAI","DAI"];
			await UnifiedDeploy(hre, contract, constructorParameters);
		}
		else
		{
			console.log(`\x1B[32m${contract}\x1B[0m - reused at ${tokens[chainId].DAI.address}\x1B[0m ...`);
		}
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Cannot deploy DAI because it's not set in current chain tokens\x1B[0m ...`);
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "mockTokens"];
