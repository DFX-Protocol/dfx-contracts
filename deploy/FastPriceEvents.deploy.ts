import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedDeploy } from "../scripts/DeployHelper";
import { chainConfig } from "../config/Constants";

const contract = "FastPriceEvents";
const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(chainConfig[chainId].isOracleAvailable)
	{
		await UnifiedDeploy(hre, contract);
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mainnet"];