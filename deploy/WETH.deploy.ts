import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import { tokens } from "../config/Constants";
import { ethers } from "hardhat";


const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";
const { AddressZero } = ethers.constants;

const contract = "WETH";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(tokens[chainId].WETH !== null && tokens[chainId].WETH !== undefined)
	{
		if(tokens[chainId].WETH.address === AddressZero || tokens[chainId].WETH.address === undefined)
		{
			const constructorParameters = ["Wrapped Ether","WETH",18];
			await UnifiedDeploy(hre, contract, constructorParameters);
		}
		else
		{
			console.log(`\x1B[32m${contract}\x1B[0m - reused at ${tokens[chainId].WETH.address}\x1B[0m ...`);
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
