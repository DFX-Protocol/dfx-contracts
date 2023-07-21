import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { EmitOnlyThis } from "../../helpers";
import { IERC20, IERC20AltApprove } from "../../../typechain-types";
import { GeneralTests } from "../../helpers/shared/General.shared";


export class IERC20AltApproveTests extends GeneralTests<Promise<{ token: IERC20 & IERC20AltApprove; alice: SignerWithAddress; bob: SignerWithAddress; }>>
{
	protected override Context: Mocha.Suite;

	constructor(deployFixture: () => Promise<{ token: IERC20 & IERC20AltApprove; alice: SignerWithAddress; bob: SignerWithAddress; }>, ...inheritedTests: GeneralTests<unknown>[])
	{
		super(deployFixture);
		this.Context = context("IERC20AltApprove", async () => {});
		this.Context = this.Context.addTest(this.DecreaseAllowance_ShouldAllowTokenHolderToChangeAllowance())
			.addTest(this.DecreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceMultibleTimes())
			.addTest(this.DecreaseAllowance_ShouldNotAllowTokenHolderToChangeAllowanceBelowZero())
			.addTest(this.IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowance())
			.addTest(this.IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceAboveHoldTokens())
			.addTest(this.IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceMultibleTimes());
		this.Initialize(...inheritedTests);
	}

	private DecreaseAllowance_ShouldAllowTokenHolderToChangeAllowance(): Mocha.Test
	{
		return it("decreaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			await token.increaseAllowance(bob.address, 100);
			const expectedAllowance = BigNumber.from(50);
			// Act
			const result = await token.decreaseAllowance(bob.address, 50);
			// Assert
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
			expect(await token.allowance(alice.address, bob.address)).to.be.equal(expectedAllowance);
		});
	}

	DecreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceMultibleTimes(): Mocha.Test
	{
		return it("decreaseAllowance: Should allow token holder to change allowance multible times", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			await token.increaseAllowance(bob.address, 100);
			const expectedAllowance = BigNumber.from(20);
			// Act
			await token.decreaseAllowance(bob.address, 50);
			await token.decreaseAllowance(bob.address, 10);
			await token.decreaseAllowance(bob.address, 20);
			// Assert
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	}

	DecreaseAllowance_ShouldNotAllowTokenHolderToChangeAllowanceBelowZero(): Mocha.Test
	{
		return it("decreaseAllowance: Should not allow token holder to change allowance below 0", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			await token.increaseAllowance(bob.address, 100);
			const allowance = await token.allowance(alice.address, bob.address);
			const expectedAllowance = BigNumber.from(100);
			// Act
			const result = token.decreaseAllowance(bob.address, allowance.add(1));
			// Assert
			await expect(result).to.revertedWithCustomError(token, "AllowanceBelowZero").withArgs(100, 101);
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	}

	IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowance(): Mocha.Test
	{
		return it("increaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			const expectedAllowance = BigNumber.from(50);
			// Act
			const result = await token.increaseAllowance(bob.address, 50);
			// Assert
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	}

	IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceAboveHoldTokens(): Mocha.Test
	{
		return it("increaseAllowance: Should allow token holder to change allowance above hold tokens", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			const balance = await token.balanceOf(alice.address);
			await token.approve(bob.address, balance);
			const expectedAllowance = BigNumber.from(200).add(balance);
			// Act
			const result = await token.increaseAllowance(bob.address, 200);
			// Assert
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	}

	IncreaseAllowance_ShouldAllowTokenHolderToChangeAllowanceMultibleTimes(): Mocha.Test
	{
		return it("increaseAllowance: Should allow token holder to change allowance multible times", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			await token.approve(bob.address, 0);
			const expectedAllowance = BigNumber.from(80);
			// Act
			await token.increaseAllowance(bob.address, 50);
			await token.increaseAllowance(bob.address, 10);
			await token.increaseAllowance(bob.address, 20);
			// Assert
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	}
}
