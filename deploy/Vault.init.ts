import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const contract = "Vault_Init";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const initContractName = "Vault";
	const vault = await deployments.get(initContractName);
	const initContract = await ethers.getContractAt(initContractName, vault.address);
	const router = await deployments.get("Router");
	const usdg = await deployments.get("USDG");
	const vaultPriceFeed = await deployments.get("VaultPriceFeed");
	const liquidationFeeUsd = BigNumber.from(2).mul(BigNumber.from(10).pow(30)); // ~2 USD can be updated later with the setPriceFeed function
	const fundingRateFactor = 100;
	const stableFundingRateFactor  = 100;
	const isInitialized = await initContract.isInitialized();

	if (!isInitialized)
	{
		console.log(`\x1B[32m${initContractName}\x1B[0m - Initializing contract with deployer \x1B[33m${deployer}\x1B[0m ...`);
		console.log(`\x1B[32m${initContractName}\x1B[0m - Using init parameters \x1B[33m${router.address},${usdg.address},${vaultPriceFeed.address},${liquidationFeeUsd},${fundingRateFactor},${stableFundingRateFactor}\x1B[0m ...`);
		(await initContract.connect(depSign).initialize(
			router.address,
			usdg.address,
			vaultPriceFeed.address,
			liquidationFeeUsd,
			fundingRateFactor,
			stableFundingRateFactor
		)).wait();
		console.log(`\x1B[32m${initContractName}\x1B[0m - initialized`);
	}
	else
	{
		console.log(`\x1B[32m${initContractName}\x1B[0m - already initialized`);
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract];
func.dependencies = ["Vault", "Router", "VaultPriceFeed"];