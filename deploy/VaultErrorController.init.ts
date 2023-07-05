import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GetDeployedContracts } from "../scripts/DeployHelper";

const contract = "VaultErrorController";
const contractDependencies = [contract, "Vault"];

const errors = [
	"Vault: zero error",
	"Vault: already initialized",
	"Vault: invalid _maxLeverage",
	"Vault: invalid _taxBasisPoints",
	"Vault: invalid _stableTaxBasisPoints",
	"Vault: invalid _mintBurnFeeBasisPoints",
	"Vault: invalid _swapFeeBasisPoints",
	"Vault: invalid _stableSwapFeeBasisPoints",
	"Vault: invalid _marginFeeBasisPoints",
	"Vault: invalid _liquidationFeeUsd",
	"Vault: invalid _fundingInterval",
	"Vault: invalid _fundingRateFactor",
	"Vault: invalid _stableFundingRateFactor",
	"Vault: token not whitelisted",
	"Vault: _token not whitelisted",
	"Vault: invalid tokenAmount",
	"Vault: _token not whitelisted",
	"Vault: invalid tokenAmount",
	"Vault: invalid usdgAmount",
	"Vault: _token not whitelisted",
	"Vault: invalid usdgAmount",
	"Vault: invalid redemptionAmount",
	"Vault: invalid amountOut",
	"Vault: swaps not enabled",
	"Vault: _tokenIn not whitelisted",
	"Vault: _tokenOut not whitelisted",
	"Vault: invalid tokens",
	"Vault: invalid amountIn",
	"Vault: leverage not enabled",
	"Vault: insufficient collateral for fees",
	"Vault: invalid position.size",
	"Vault: empty position",
	"Vault: position size exceeded",
	"Vault: position collateral exceeded",
	"Vault: invalid liquidator",
	"Vault: empty position",
	"Vault: position cannot be liquidated",
	"Vault: invalid position",
	"Vault: invalid _averagePrice",
	"Vault: collateral should be withdrawn",
	"Vault: _size must be more than _collateral",
	"Vault: invalid msg.sender",
	"Vault: mismatched tokens",
	"Vault: _collateralToken not whitelisted",
	"Vault: _collateralToken must not be a stableToken",
	"Vault: _collateralToken not whitelisted",
	"Vault: _collateralToken must be a stableToken",
	"Vault: _indexToken must not be a stableToken",
	"Vault: _indexToken not shortable",
	"Vault: invalid increase",
	"Vault: reserve exceeds pool",
	"Vault: max USDG exceeded",
	"Vault: reserve exceeds pool",
	"Vault: forbidden",
	"Vault: forbidden",
	"Vault: maxGasPrice exceeded"
];
  

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) =>
{
	const dependencies = await GetDeployedContracts(hre, contractDependencies);
	const { deployments, getNamedAccounts } = hre;
	const { deployer } = await getNamedAccounts();
	const depSign = await ethers.getSigner(deployer);

	const vaultContractData = await deployments.get("Vault");
	const vaultContract = await ethers.getContractAt("Vault", vaultContractData.address);

	await vaultContract.connect(depSign).setErrorController(dependencies[contract].address);

	const vaultErrorControllerContractData = await deployments.get(contract);
	const vaultErrorControllerContract = await ethers.getContractAt(contract, vaultErrorControllerContractData.address);

	await vaultErrorControllerContract.connect(depSign).setErrors(vaultContractData.address, errors);
};

export default func;

func.id = `Deploy_${contract}_Init`; // id required to prevent reexecution
func.tags = [`${contract}_Init`, "testnet", "mainnet"];
func.dependencies = [...contractDependencies];