import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import {  chainConfig, tokens } from "../config/Constants";

const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const contract = "PriceFeed[BTC]";
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(!chainConfig[chainId].isOracleAvailable && chainConfig[chainId].shouldConfigOracle)
	{
		if(tokens[chainId].BTC !== null && tokens[chainId].BTC !== undefined)
		{
			await UnifiedDeploy(hre, contract);
		}
		else
		{
			console.log(`\x1B[32m${contract}\x1B[0m - Cannot deploy ${contract} price feed because its not set in tokens constants\x1B[0m ...`);
		}
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [`${contract}`, "mockTokens"];
