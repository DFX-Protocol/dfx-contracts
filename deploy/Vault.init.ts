import { BigNumber } from "ethers";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "Vault";
const contractDependencies = [contract, "Router", "USDG", "VaultPriceFeed"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const liquidationFeeUsd = BigNumber.from(2).mul(BigNumber.from(10).pow(30)); // ~2 USD can be updated later with the setPriceFeed function
	const fundingRateFactor = 100;
	const stableFundingRateFactor  = 100;
	await UnifiedInitialize(hre, contract,
		[
			dependencies["Router"].address,
			dependencies["USDG"].address,
			dependencies["VaultPriceFeed"].address,
			liquidationFeeUsd,
			fundingRateFactor,
			stableFundingRateFactor
		]);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];