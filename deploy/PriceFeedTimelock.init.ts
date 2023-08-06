import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetContractHandler, CallSetKeeper, CallSetGov } from "../scripts/DeployHelper";

const contract = "PriceFeedTimelock";
const contractDependencies = [contract, "VaultPriceFeed", "FastPriceFeed"];

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
	await CallSetGov(hre, "FastPriceFeed", contract);  
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "mainnet", "timelocks"];
func.dependencies = [...contractDependencies];