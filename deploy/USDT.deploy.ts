import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import { tokens } from "../config/Constants";
import { ethers } from "hardhat";

const { AddressZero } = ethers.constants;

const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";
const contract = "ERC20Mock[USDT]";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(tokens[chainId].USDT.address === AddressZero || tokens[chainId].USDT.address === undefined)
	{
		const constructorParameters = ["USDT Tether","USDT"];
		await UnifiedDeploy(hre, contract, constructorParameters);
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - reused at ${tokens[chainId].USDT.address}\x1B[0m ...`);
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mockTokens"];
