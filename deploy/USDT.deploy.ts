import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import { tokens } from "../scripts/Constants";
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
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mockTokens"];
