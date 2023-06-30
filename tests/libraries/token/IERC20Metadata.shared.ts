import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { IERC20Metadata } from "../../../typechain-types";

export class IERC20MetadataTests
{
	protected _deployFixture: () => Promise<{ token: IERC20Metadata; }>;
	protected _name: string;
	protected _symbol: string;
	protected _decimals: number;

	constructor(deployFixture: () => Promise<{ token: IERC20Metadata; }>, name: string, symbol: string, decimals: number)
	{
		this._deployFixture = deployFixture;
		this._name = name;
		this._symbol = symbol;
		this._decimals = decimals;
	}

	Decimals_ShouldReturnCorrectDecimals() : Mocha.Test
	{
		return it("ERC20.decimals: Should return correct decimals", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			const result: number = await token.decimals();
			// Assert
			expect(result).to.equal(this._decimals);
		});
	}

	Name_ShouldReturnCorrectName() : Mocha.Test
	{
		return it("ERC20.name: Should return correct name", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			const result = await token.name();
			// Assert
			expect(result).to.equal(this._name);
		});
	}

	Symbol_ShouldReturnCorrectSymbol(): Mocha.Test
	{
		return it("ERC20.symbol: Should return correct symbol", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			const result = await token.symbol();
			// Assert
			expect(result).to.equal(this._symbol);
		});
	}
}

export function testIERC20Metadata(testClass: IERC20MetadataTests)
{
	context("IERC20Metadata", async () =>
	{
		testClass.Decimals_ShouldReturnCorrectDecimals();

		testClass.Name_ShouldReturnCorrectName();

		testClass.Symbol_ShouldReturnCorrectSymbol();
	});
}
