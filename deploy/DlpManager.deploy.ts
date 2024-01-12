import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";
import { ethers } from "hardhat";

const contract = "DlpManager";
const contractDependencies = ["Vault", "USDG", "DLP", "ShortsTracker"];

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
		dependencies["DLP"].address,
		dependencies["ShortsTracker"].address,
		15 * 60 // 15 mins
	];
	await UnifiedDeploy(hre, contract, constructorParameters);
	const contractData = await deployments.get(contract);
	const dlpManager = await ethers.getContractAt(contract, contractData.address);
	if (!await dlpManager.inPrivateMode())
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33mdlpManager.setInPrivateMode(true)\x1B[0m ...`);
		await (await dlpManager.connect(depSign).setInPrivateMode(true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33mdlpManager.setInPrivateMode(true)\x1B[0m ...`);
	}
	const vault = await ethers.getContractAt("Vault", dependencies["Vault"].address);
	const usdg = await ethers.getContractAt("USDG", dependencies["USDG"].address);
	const dlp = await ethers.getContractAt("DLP", dependencies["DLP"].address);

	if (!await dlp.isMinter(dlpManager.address))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33mdlp.setMinter("${dlpManager.address}", true)\x1B[0m ...`);
		await (await dlp.connect(depSign).setMinter(dlpManager.address, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33mdlp.setMinter("${dlpManager.address}", true)\x1B[0m ...`);
	}
	if (!await usdg.vaults(dlpManager.address))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33musdg.addVault("${dlpManager.address}")\x1B[0m ...`);
		await (await usdg.connect(depSign).addVault(dlpManager.address)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33musdg.addVault("${dlpManager.address}")\x1B[0m ...`);
	}
	if (!await vault.isManager(dlpManager.address))
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Call \x1B[33mvault.setManager("${dlpManager.address}", true)\x1B[0m ...`);
		await (await vault.connect(depSign).setManager(dlpManager.address, true)).wait();
	}
	else
	{
		console.log(`\x1B[32m${contract}\x1B[0m - Already set. Skip \x1B[33mvault.setManager("${dlpManager.address}", true)\x1B[0m ...`);
	}
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];