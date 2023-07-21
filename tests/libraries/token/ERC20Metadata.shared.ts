import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { IERC20Metadata } from "../../../typechain-types";
import { GeneralTests } from "../../helpers/shared/General.shared";


export class IERC20MetadataTests extends GeneralTests<Promise<{ token: IERC20Metadata; alice: SignerWithAddress; bob: SignerWithAddress; carol: SignerWithAddress; }>>
{
	protected _name: string;
	protected _symbol: string;
	protected _decimals: number;

	public override Context: Mocha.Suite = context("IERC20Metadata", async () =>
	{
		this.Decimals_ShouldReturnCorrectDecimals();
		this.Name_ShouldReturnCorrectName();
		this.Symbol_ShouldReturnCorrectSymbol();
	});

	constructor(deployFixture: () => Promise<{ token: IERC20Metadata; alice: SignerWithAddress; bob: SignerWithAddress; carol: SignerWithAddress; }>, name: string, symbol: string, decimals: number, ...inheritedTests: GeneralTests<unknown>[])
	{
		super(deployFixture);
		// this.Initialize(...inheritedTests);
		this._name = name;
		this._symbol = symbol;
		this._decimals = decimals;
	}

	Decimals_ShouldReturnCorrectDecimals(): Mocha.Test
	{
		return it("decimals: Should return correct decimals", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			const result: number = await token.decimals();
			// Assert
			expect(result).to.equal(this._decimals);
		});
	}

	Name_ShouldReturnCorrectName(): Mocha.Test
	{
		return it("name: Should return correct name", async () =>
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
		return it("symbol: Should return correct symbol", async () =>
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
