import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetGov } from "../scripts/DeployHelper";

const contract = "GmxTimelock";
const contractDependencies = [contract, "GMX"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await CallSetGov(hre, "GMX", contract);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "mainnet", "timelocks"];
func.dependencies = [...contractDependencies];