import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CallSetGov } from "../scripts/DeployHelper";

const contract = "DfxTimelock";
const contractDependencies = [contract, "DFX"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	await CallSetGov(hre, "DFX", contract);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "mainnet", "timelocks"];
func.dependencies = [...contractDependencies];