import "@nomicfoundation/hardhat-toolbox";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-tracer";
import "solidity-docgen";
import * as dotenv from "dotenv";
import { PageAssigner } from "solidity-docgen/dist/site";
import { LoadNetworkSpecificValues } from "./scripts/DeployConstants";

dotenv.config();

const { accounts, deployer, dev } = LoadNetworkSpecificValues();

const excludePath: RegExp[] = [/\/mocks\//, /\/compare\//];
const pa: PageAssigner = (item, file, config) =>
{
	for (const excludeMe of excludePath)
	{
		if (excludeMe.test(file.absolutePath))
		{
			return undefined;
		}
	}
	return file.absolutePath.replace(".sol", config.pageExtension);
};

const config = {
	abiExporter:
		[
			{
				runOnCompile: true,
				path: "./abi/json",
				clear: true,
				flat: false,
				format: "json"
			},
			{
				runOnCompile: true,
				path: "./abi/compact",
				clear: true,
				flat: false,
				format: "fullName"
			}
		],
	contractSizer:
	{
		runOnCompile: true,
		except: ["contracts/mocks", "contracts/compare", "hardhat/console"]
	},
	docgen: {
		pages: pa, // "files",
		templates: "doctemplates"
	},
	etherscan: { apiKey: process.env.ETHERSCAN_API_KEY },
	gasReporter:
	{
		enabled: process.env.REPORT_GAS === "true",
		coinmarketcap: process.env.COINMARKETCAP_API_KEY,
		currency: "EUR",
		excludeContracts:
			[
				"contracts/mocks",
				"contracts/compare"
			]
	},
	namedAccounts:
	{
		deployer: {
			default: deployer ?? 0
		},
		dev: {
			// Default to 1
			default: dev ?? 1
		},
		signer1: { default: 2 }, // Used in TokenManager.init.ts replace with real signers as soon as possible.
		signer2: { default: 3 }, // Used in TokenManager.init.ts replace with real signers as soon as possible.
		signer3: { default: 4 }, // Used in TokenManager.init.ts replace with real signers as soon as possible.
		signer4: { default: 5 }, // Used in TokenManager.init.ts replace with real signers as soon as possible.
		signer5: { default: 6 }, // Used in TokenManager.init.ts replace with real signers as soon as possible.
		signer6: { default: 7 } // Used in TokenManager.init.ts replace with real signers as soon as possible.
	},
	networks: {
		hedera:
		{
			url: `${process.env.HEDERA_RPC_URL}`,
			accounts
		},
		hederaTestnet:
		{
			url: `${process.env.HEDERA_TESTNET_RPC_URL}`,
			accounts,
			timeout: 100000
		},
		goerli: {
			url: `${process.env.GOERLI_RPC_URL}`,
			accounts
		},
		sepolia: {
			url: `${process.env.SEPOLIA_RPC_URL}`,
			accounts
		}
		// ,
		// hardhat:
		// {
		// 	forking:
		// 	{
		// 		url: "https://mainnet.hashio.io/api"
		// 	}
		// } //Not Working
	},
	paths: {
		tests: "./tests" // default="./test"
	},
	solidity: {
		compilers: [
			{
				version: "0.8.20",
				settings:
				{
					optimizer:
					{
						enabled: true,
						runs: 500000
					}
				},
				viaIR: true
			},
			{
				version: "0.6.12",
				settings:
				{
					optimizer:
					{
						enabled: true,
						runs: 10
					}
				},
				viaIR: false
			}
		],
		overrides: {
			"contracts/core/Vault.sol": {
				version: "0.8.20",
				settings:
				{
					optimizer:
					{
						enabled: true,
						runs: 200
					}
				},
				viaIR: true
			},
			"contracts/core/OrderBook.sol": {
				version: "0.8.20",
				settings:
				{
					optimizer:
					{
						enabled: true,
						runs: 1000
					}
				},
				viaIR: true
			},
			"contracts/core/PositionRouter.sol": {
				version: "0.8.20",
				settings:
				{
					optimizer:
					{
						enabled: true,
						runs: 1000
					}
				},
				viaIR: true
			},
			"contracts/core/PositionManager.sol": {
				version: "0.8.20",
				settings:
				{
					optimizer:
					{
						enabled: true,
						runs: 1000
					}
				},
				viaIR: true
			},
			"contracts/peripherals/Timelock.sol": {
				version: "0.8.20",
				settings:
				{
					optimizer:
					{
						enabled: true,
						runs: 1000
					}
				},
				viaIR: true
			},
			"contracts/libraries/hedera/SafeHTS.sol": {
				version: "0.8.20",
				settings:
				{
					optimizer:
					{
						enabled: true,
						runs: 200
					}
				},
				viaIR: true
			},
			"contracts/staking/RewardRouterV2.sol": {
				version: "0.8.20",
				settings:
				{
					optimizer:
					{
						enabled: true,
						runs: 200
					}
				},
				viaIR: true
			}
		}
	}
};

export default config;
