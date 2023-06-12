import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const contract = "Vault";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { deployments, getNamedAccounts } = hre;
	const{ deploy } = deployments;

	const { deployer } = await getNamedAccounts();
	console.log(`\x1B[32m${contract}\x1B[0m - Deploying contract with deployer \x1B[33m${deployer}\x1B[0m ...`);
	// const erc20 = await deploy(contract, { from: deployer, log: false, gasLimit: 950000 });
	const result = await deploy(contract, { from: deployer, log: false });
	console.log(`\x1B[32m${contract}\x1B[0m - ${result.newlyDeployed ? "deployed to" : "reused at"} \x1B[32m${result.address}\x1B[0m`);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract];