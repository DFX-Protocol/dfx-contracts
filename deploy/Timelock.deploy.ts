import { BigNumber } from "ethers";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts, UnifiedDeploy } from "../scripts/DeployHelper";

const contract = "Timelock";
const contractDependencies = ["TokenManager", "MintReceiver", "GlpManager", "RewardRouterV2"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const buffer = 24 * 60 * 60;
	
	const maxTokenSupply = BigNumber.from(13250000).mul(BigNumber.from(10).pow(18));
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const constructorParameters = 
	[
		deployer,
		buffer,
		dependencies["TokenManager"].address,
		dependencies["MintReceiver"].address,
		dependencies["GlpManager"].address,
		dependencies["RewardRouterV2"].address,
		maxTokenSupply,
		10, // marginFeeBasisPoints 0.1%
		500 // maxMarginFeeBasisPoints 5%
	];
	await UnifiedDeploy(hre, contract, constructorParameters);
};

export default func;

func.id = `Deploy_${contract}`; // id required to prevent reexecution
func.tags = [contract];
func.dependencies = [...contractDependencies];