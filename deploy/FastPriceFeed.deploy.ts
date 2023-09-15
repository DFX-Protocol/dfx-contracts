import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";
import { chainConfig } from "../config/Constants";

const contract = "FastPriceFeed";
const contractDependencies = ["FastPriceEvents"];
const chainId = process.env.NETWORK !== undefined? process.env.NETWORK: "sepolia";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	if(chainConfig[chainId].isOracleAvailable)
	{
		const { getNamedAccounts } = hre;
		const { deployer } = await getNamedAccounts();
		const dependencies = await GetDeployedContracts(hre, contractDependencies);
		const constructorParameters = [
			30 * 60, // _priceDuration
			60 * 60, // _maxPriceUpdateDelay
			10, // _minBlockInterval
			1000, // _maxDeviationBasisPoints,
			dependencies["FastPriceEvents"].address,
			deployer // _tokenManager
		];
		await UnifiedDeploy(hre, contract, constructorParameters);
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];