import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import { tokens } from "../scripts/Constants";
import { ethers } from "hardhat";

const { AddressZero } = ethers.constants;

const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const contract = "ERC20Mock[BUSD]";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(tokens[chainId].BUSD.address === AddressZero || tokens[chainId].BUSD.address === undefined)
	{
		const constructorParameters = ["Binance USD","BUSD"];
		await UnifiedDeploy(hre, contract, constructorParameters);
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract,"testnet", "mockTokens"];
