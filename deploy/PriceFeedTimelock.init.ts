import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetContractHandler, CallSetKeeper, CallSetGov } from "../scripts/DeployHelper";
import { chainConfig } from "../config/Constants";

const contract = "PriceFeedTimelock";
const contractDependencies = [contract, "VaultPriceFeed", "FastPriceFeed"];
const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const { deployer, signer1, signer2, signer3, signer4, signer5, signer6 } = await getNamedAccounts();
	const signers = [signer1, signer2, signer3, signer4, signer5, signer6];
	for(let i = 0; i < signers.length; i++)
	{
		await CallSetContractHandler(hre, contract, signers[i], false);
	}
	await CallSetKeeper(hre, contract, deployer, false);
	await CallSetGov(hre, "VaultPriceFeed", contract);
	if(chainConfig[chainId].isOracleAvailable)
	{
		await CallSetGov(hre, "FastPriceFeed", contract);  
	}
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "mainnet", "timelocks"];
func.dependencies = [...contractDependencies];