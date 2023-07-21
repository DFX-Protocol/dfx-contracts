import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";
import { ethers } from "hardhat";

const contract = "GlpManager";
const contractDependencies = ["Vault", "USDG", "GLP", "ShortsTracker"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const constructorParameters =
	[
		dependencies["Vault"].address,
		dependencies["USDG"].address,
		dependencies["GLP"].address,
		dependencies["ShortsTracker"].address,
		15 * 60 // 15 mins
	];
	await UnifiedDeploy(hre, contract, constructorParameters);
	const contractData = await deployments.get(contract);
	const glpManager = await ethers.getContractAt(contract, contractData.address);
	if (!await glpManager.inPrivateMode())
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33mglpManager.setInPrivateMode(true)\x1B[0m ...`);
		await (await glpManager.connect(depSign).setInPrivateMode(true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33mglpManager.setInPrivateMode(true)\x1B[0m ...`);
	}
	const vault = await ethers.getContractAt("Vault", dependencies["Vault"].address);
	const usdg = await ethers.getContractAt("USDG", dependencies["USDG"].address);
	const glp = await ethers.getContractAt("GLP", dependencies["GLP"].address);

	if (!await glp.isMinter(glpManager.address))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33mglp.setMinter("${glpManager.address}", true)\x1B[0m ...`);
		await (await glp.connect(depSign).setMinter(glpManager.address, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33mglp.setMinter("${glpManager.address}", true)\x1B[0m ...`);
	}
	if (!await usdg.vaults(glpManager.address))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33musdg.addVault("${glpManager.address}")\x1B[0m ...`);
		await (await usdg.connect(depSign).addVault(glpManager.address)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33musdg.addVault("${glpManager.address}")\x1B[0m ...`);
	}
	if (!await vault.isManager(glpManager.address))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33mvault.setManager("${glpManager.address}", true)\x1B[0m ...`);
		await (await vault.connect(depSign).setManager(glpManager.address, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33mvault.setManager("${glpManager.address}", true)\x1B[0m ...`);
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];