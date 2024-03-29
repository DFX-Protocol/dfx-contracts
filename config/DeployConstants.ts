import { tokens } from "./Constants";
const AddressZero = "0x0000000000000000000000000000000000000000";

/* eslint-disable indent */
export function LoadNetworkSpecificValues(): { accounts: string[] | { mnemonic: string }, deployer: string | undefined, dev: string | undefined }
{
	switch (process.env.NETWORK)
	{
		case undefined:
			{
				return {
					accounts: { mnemonic: "test test test test test test test test test test test junk" },
					deployer: undefined,
					dev: undefined
				};
			}
		case "hederaTestnet":
			{
				if (process.env.HEDERA_TESTNET_PRIVATE_KEY === undefined) throw Error("Missing environment variable HEDERA_TESTNET_PRIVATE_KEY");
				if (process.env.HEDERA_TESTNET_OWNER === undefined) throw Error("Missing environment variable HEDERA_TESTNET_OWNER");
				if (process.env.HEDERA_TESTNET_DEVELOPER === undefined) throw Error("Missing environment variable HEDERA_TESTNET_DEVELOPER");
				return { accounts: [process.env.HEDERA_TESTNET_PRIVATE_KEY], deployer: process.env.HEDERA_TESTNET_OWNER, dev: process.env.HEDERA_TESTNET_DEVELOPER };
			}
		case "hedera":
			{
				if (process.env.HEDERA_MAINNET_PRIVATE_KEY === undefined) throw Error("Missing environment variable HEDERA_MAINNET_PRIVATE_KEY");
				if (process.env.HEDERA_OWNER === undefined) throw Error("Missing environment variable HEDERA_OWNER");
				if (process.env.HEDERA_DEVELOPER === undefined) throw Error("Missing environment variable HEDERA_DEVELOPER");
				return { accounts: [process.env.HEDERA_MAINNET_PRIVATE_KEY], deployer: process.env.HEDERA_OWNER, dev: process.env.HEDERA_DEVELOPER };
			}
		case "goerli":
			{
				if (process.env.GOERLI_MNEMONIC === undefined) throw Error("Missing environment variable GOERLI_MNEMONIC");
				if (process.env.GOERLI_OWNER === undefined) throw Error("Missing environment variable GOERLI_OWNER");
				if (process.env.GOERLI_DEVELOPER === undefined) throw Error("Missing environment variable GOERLI_DEVELOPER");
				return {
					accounts: {
						mnemonic: process.env.GOERLI_MNEMONIC
						// accountsBalance: ethers.utils.parseEther("1");
					}, deployer: process.env.GOERLI_OWNER, dev: process.env.GOERLI_DEVELOPER
				};
			}
		case "sepolia":
			{
				if (process.env.SEPOLIA_MNEMONIC === undefined) throw Error("Missing environment variable SEPOLIA_MNEMONIC");
				if (process.env.SEPOLIA_OWNER === undefined) throw Error("Missing environment variable SEPOLIA_OWNER");
				if (process.env.SEPOLIA_DEVELOPER === undefined) throw Error("Missing environment variable SEPOLIA_DEVELOPER");
				return {
					accounts: {
						mnemonic: process.env.SEPOLIA_MNEMONIC
						// accountsBalance: ethers.utils.parseEther("1");
					}, deployer: process.env.SEPOLIA_OWNER, dev: process.env.SEPOLIA_DEVELOPER
				};
			}
		case "baseGoerli":
			{
				if (process.env.BASE_GOERLI_MNEMONIC === undefined) throw Error("Missing environment variable BASE_GOERLI_MNEMONIC");
				if (process.env.BASE_GOERLI_OWNER === undefined) throw Error("Missing environment variable BASE_GOERLI_OWNER");
				if (process.env.BASE_GOERLI_DEVELOPER === undefined) throw Error("Missing environment variable BASE_GOERLI_DEVELOPER");
				if (process.env.BASE_GOERLI_ETHERSCAN_API_KEY === undefined) throw Error("Missing environment variable BASE_GOERLI_ETHERSCAN_API_KEY");
				return {
					accounts: {
						mnemonic: process.env.BASE_GOERLI_MNEMONIC
						// accountsBalance: ethers.utils.parseEther("1");
					}, deployer: process.env.BASE_GOERLI_OWNER, dev: process.env.BASE_GOERLI_DEVELOPER
				};
			}
			case "baseSepolia":
				{
					if (process.env.BASE_SEPOLIA_MNEMONIC === undefined) throw Error("Missing environment variable BASE_SEPOLIA_MNEMONIC");
					if (process.env.BASE_SEPOLIA_OWNER === undefined) throw Error("Missing environment variable BASE_SEPOLIA_OWNER");
					if (process.env.BASE_SEPOLIA_DEVELOPER === undefined) throw Error("Missing environment variable BASE_SEPOLIA_DEVELOPER");
					if (process.env.BASE_SEPOLIA_ETHERSCAN_API_KEY === undefined) throw Error("Missing environment variable BASE_SEPOLIA_ETHERSCAN_API_KEY");
					return {
						accounts: {
							mnemonic: process.env.BASE_SEPOLIA_MNEMONIC
							// accountsBalance: ethers.utils.parseEther("1");
						}, deployer: process.env.BASE_SEPOLIA_OWNER, dev: process.env.BASE_SEPOLIA_DEVELOPER
					};
				}
		default:
			throw Error(`Unknown network ${process.env.NETWORK}`);
	}
}

export async function GetTokenAddress(): Promise<{ nativeToken: string, multicall3: string, uniswapV2Router: string, uniswapV2Factory: string }>
{
	
	switch (process.env.NETWORK)
	{
		// case "hederaTestnet":
		// 	return "0x0";
		// case "hedera":
		// 	return "0x0";
		case "goerli":
				return {
					nativeToken: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", // WETH
					multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11", // https://www.multicall3.com/deployments
					uniswapV2Router: AddressZero,
					uniswapV2Factory: AddressZero

				};
		case "sepolia":
			return {
				nativeToken: tokens["sepolia"].WETH.address, // WETH
				multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11", // https://www.multicall3.com/deployments
				uniswapV2Router: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
				uniswapV2Factory: "0x7E0987E5b3a30e3f2828572Bb659A548460a3003"

			};
		case "baseGoerli":
			return {
				nativeToken: tokens["baseGoerli"].WETH.address, // WETH
				multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11", // https://www.multicall3.com/deployments
				uniswapV2Router: "0x8357227D4eDc78991Db6FDB9bD6ADE250536dE1d", // This is v3, taken from https://docs.base.org/contracts
				uniswapV2Factory: "0x9323c1d6D800ed51Bd7C6B216cfBec678B7d0BC2" // This is v3, taken from https://docs.base.org/contracts

			};
		case "baseSepolia":
				return {
					nativeToken: tokens["baseSepolia"].WETH.address, // WETH
					multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11", // https://www.multicall3.com/deployments
					uniswapV2Router: "0x1B8b57CF7e35375B40E7bc607D48CebdCcDd3102", // Self deployed
					uniswapV2Factory: "0x598CaDbd4A89E8716D26E8ECbC882fdE6BFa0DDb" // Self deployed
	
				};
		default:
			throw Error(`Unknown network ${process.env.NETWORK}`);
	}
}