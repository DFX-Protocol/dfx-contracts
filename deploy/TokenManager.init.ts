import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UnifiedInitialize } from "../scripts/DeployHelper";

const contract = "TokenManager";
const contractDependencies = [contract];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const { getNamedAccounts } = hre;
	const { signer1, signer2, signer3, signer4, signer5, signer6 } = await getNamedAccounts();

	const initParameters =
		[
			signer1,
			signer2,
			signer3,
			signer4,
			signer5,
			signer6
		];
	await UnifiedInitialize(hre, contract, initParameters);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`];
func.dependencies = [...contractDependencies];