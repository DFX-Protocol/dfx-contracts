export const tokens = {
	"sepolia":{
		USDT: {
			contractName: "ERC20Mock[USDT]",
			address: "0x757221aeDDe3ECE6271D91C3E5f1aE305974022c",
			decimals: 18,
			price: 0.9995,
			priceDecimals: 18,
			isStrictStable: true,
			priceFeedContractName: "PriceFeed[USDT]",
			tokenWeight: 2000,
			minProfitBps: 0,
			maxUsdgAmount: 5 * 1000 * 1000,
			bufferAmount: 1 * 1000 * 1000,
			isStable: true,
			isShortable: false,
		},
		BUSD: {
			contractName: "ERC20Mock[BUSD]",
			address: "0x8577CcCD4cF71Dd23F4cf31Be940A07E89174d56",
			decimals: 18,
			priceDecimals: 18,
			price: 0.999962,
			isStrictStable: true,
			priceFeedContractName: "PriceFeed[BUSD]",
			tokenWeight: 2000,
			minProfitBps: 0,
			maxUsdgAmount: 5 * 1000 * 1000,
			bufferAmount: 1 * 1000 * 1000,
			isStable: true,
			isShortable: false,
		},
		BTC: {
			contractName: "ERC20Mock[BTC]",
			address: "0x0297783626F4dBDa1f21333c6A584447a9261a42",
			decimals: 18,
			isStrictStable: false,
			price: 30443.90,
			priceFeedContractName: "PriceFeed[BTC]",
			tokenWeight: 23000, // tokenWeights allows customisation of index composition
			minProfitBps: 0,
			maxUsdgAmount: 115 * 1000 * 1000, // Total pool capacity
			bufferAmount: 2500,  // Spare amount to keep in pool that should not be used by swaps but for leverage alone
			priceDecimals: 18,
			fastPricePrecision: 1000,
			maxCumulativeDeltaDiff: 0.1 * 10 * 1000 * 1000, // 10%
			isStable: false,
			isShortable: true,
			maxGlobalLongSize: 60 * 1000 * 1000,
			maxGlobalShortSize: 25 * 1000 * 1000,
			openInterestLimitLong: 80 * 1000 * 1000,
			openInterestLimitShort: 50 * 1000 * 1000,
			maxOpenInterestLong: 80 * 1000 * 1000,
			maxOpenInterestShort: 50 * 1000 * 1000,
			openInterestIncrementLong: 50 * 1000,
			openInterestIncrementShort: 50 * 1000,
			maxLiquidityThresholdLong: 20 * 1000 * 1000,
			maxLiquidityThresholdShort: 12 * 1000 * 1000,
			minLiquidityThresholdLong: 12 * 1000 * 1000,
			minLiquidityThresholdShort: 5 * 1000 * 1000,
		},
		BNB: {
			contractName: "ERC20Mock[BNB]",
			address: "0xAeb6b50E347C22a95479A397f9a9aff6b26ECA2B",
			decimals: 18,
			priceDecimals: 18,
			price: 243.4264,
			isStrictStable: false,
			priceFeedContractName: "PriceFeed[BNB]",
			tokenWeight: 18000,
			minProfitBps: 0,
			maxUsdgAmount: 80 * 1000 * 1000,
			bufferAmount: 8000,
			isStable: false,
			isShortable: true,

		},
		WETH: {
			contractName: "WETH",
			address: "0x4f3fe6C943B2e501651164E293a24D5dDB62131e",
			decimals: 18,
			isStrictStable: false,
			price: 1911.08,
			priceFeedContractName: "PriceFeed[WETH]",
			priceDecimals: 18,
			fastPricePrecision: 1000,
			maxCumulativeDeltaDiff: 0.1 * 10 * 1000 * 1000, // 10%
			tokenWeight: 28000,
			minProfitBps: 0,
			maxUsdgAmount: 180 * 1000 * 1000,
			bufferAmount: 60000,
			isStable: false,
			isShortable: true,
			maxGlobalLongSize: 80 * 1000 * 1000,
			maxGlobalShortSize: 30 * 1000 * 1000,
			openInterestLimitLong: 110 * 1000 * 1000,
			openInterestLimitShort: 70 * 1000 * 1000,
			maxOpenInterestLong: 100 * 1000 * 1000,
			maxOpenInterestShort: 60 * 1000 * 1000,
			openInterestIncrementLong: 50 * 1000,
			openInterestIncrementShort: 50 * 1000,
			maxLiquidityThresholdLong: 20 * 1000 * 1000,
			maxLiquidityThresholdShort: 12 * 1000 * 1000,
			minLiquidityThresholdLong: 12 * 1000 * 1000,
			minLiquidityThresholdShort: 5 * 1000 * 1000,
		}
	}
};