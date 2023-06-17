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
		default:
			throw Error(`Unknown network ${process.env.NETWORK}`);
	}
}

export async function GetTokenAddress(): Promise<{ nativeToken: string, multicall3: string }>
{
	switch (process.env.NETWORK)
	{
		// case "hederaTestnet":
		// 	return "0x0";
		// case "hedera":
		// 	return "0x0";
		case "goerli":
			{
				return {
					nativeToken: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6", // WETH
					multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11" // https://www.multicall3.com/deployments
				};
			}
		case "sepolia":
			return {
				nativeToken: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // WETH
				multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11" // https://www.multicall3.com/deployments
			};
		default:
			throw Error(`Unknown network ${process.env.NETWORK}`);
	}
}