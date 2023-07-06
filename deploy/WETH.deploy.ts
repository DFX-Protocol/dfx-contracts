import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import { tokens } from "../scripts/Constants";
import { ethers } from "hardhat";


const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";
const { AddressZero } = ethers.constants;

const contract = "WETH";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(tokens[chainId].WETH.address === AddressZero || tokens[chainId].WETH.address === undefined)
	{
		const constructorParameters = ["Wrapped Ether","WETH",18];
		await UnifiedDeploy(hre, contract, constructorParameters);
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mockTokens"];
