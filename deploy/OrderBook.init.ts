import { BigNumber } from "ethers";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedInitialize, CallAddPlugin } from "../scripts/DeployHelper";
import { GetTokenAddress } from "../config/DeployConstants";

const contract = "OrderBook";
const contractDependencies =
	[
		contract,
		"Router",
		"Vault",
		"USDG",
	];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { nativeToken } = await GetTokenAddress();
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const initParameters =
	[
		dependencies["Router"].address, // router
		dependencies["Vault"].address, // vault
		nativeToken, // weth
		dependencies["USDG"].address, // usdg
		"10000000000000000", // 0.01
		BigNumber.from(10).pow(30), // min purchase token amount usd
	];
	await UnifiedInitialize(hre, contract, initParameters);
	await CallAddPlugin(hre, "Router", contract);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];