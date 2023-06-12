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
		}
	},
	networks: {
		hedera:
		{
			url: "https://mainnet.hashio.io/api",
			accounts
		},
		hederaTestnet:
		{
			url: "https://testnet.hashio.io/api",
			accounts,
			timeout: 100000
		},
		goerli: {
			url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
			accounts
		},
		sepolia: {
			url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
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
				}
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
				}
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
				}
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
				}
			}
		}
	}
};

export default config;
