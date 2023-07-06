import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import { tokens } from "../scripts/Constants";
import { ethers } from "hardhat";

const { AddressZero } = ethers.constants;

const contract = "ERC20Mock[BNB]";
const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(tokens[chainId].BNB.address === AddressZero || tokens[chainId].BNB.address === undefined)
	{
		const constructorParameters = ["Binance Coin","BNB"];
		await UnifiedDeploy(hre, contract, constructorParameters);
	}
	
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mockTokens"];
