import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { ADDRESS_ZERO, AdvanceBlock, EmitOnlyThis, StartAutomine, StopAutomine, UINT256_MAX } from "../../helpers";
import { IERC20 } from "../../../typechain-types";
import { GeneralTests } from "../../helpers/shared/General.shared";

export class IERC20Tests extends GeneralTests<Promise<{ token: IERC20; alice: SignerWithAddress; bob: SignerWithAddress; carol: SignerWithAddress; }>>
{
	public override Context: Mocha.Suite = context("IERC20", async () =>
	{
		this.Approve_ProofOfUnfixableApproveAttackVector();
		this.Approve_ShouldAllowSetOfApproval();
		this.Approve_ShouldEmitApprovalEvent();
		this.Approve_ShouldNotAllowSetOfApprovalFromZeroAddress();
		this.Approve_ShouldNotAllowSetOfApprovalToZeroAddress();
		this.TransferFrom_ShouldAllowTokenTransferAndNotReduceInfiniteAllowance();
		this.TransferFrom_ShouldAllowTokenTransferAndReduceAllowance();
		this.TransferFrom_ShouldEmitTransferAndApprovalEvent();
		this.TransferFrom_ShouldNotAllowTransferMoreThanAllowance();
		this.TransferFrom_ShouldNotAllowTransferMoreThanBalance();
		this.Transfer_ShouldAllowTokenTransfer();
		this.Transfer_ShouldEmitTransferEvent();
		this.Transfer_ShouldNotAllowTransferFromZeroAddress();
		this.Transfer_ShouldNotAllowTransferMoreThanBalance();
		this.Transfer_ShouldNotAllowTransferToZeroAddress();
	});

	constructor(deployFixture: () => Promise<{ token: IERC20; alice: SignerWithAddress; bob: SignerWithAddress; carol: SignerWithAddress; }>, ...inheritedTests: GeneralTests<unknown>[])
	{
		super(deployFixture);
		// this.Initialize(...inheritedTests);
	}


	Approve_ShouldNotAllowSetOfApprovalFromZeroAddress(): Mocha.Test
	{
		return it("approve: Should not allow set of approval from zero address", async () =>
		{
			// Arrange
			const { token, alice } = await loadFixture(this._deployFixture);
			const signerZero = await ethers.getImpersonatedSigner(ADDRESS_ZERO); // Fund the zero address to pay for the transaction
			await alice.sendTransaction({ to: signerZero.address, value: ethers.utils.parseEther("1") }); // Send 1 ETH;

			// Act
			const result = token.connect(signerZero).approve(alice.address, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve from zero address.");
		});
	}

	Approve_ShouldNotAllowSetOfApprovalToZeroAddress(): Mocha.Test
	{
		return it("approve: Should not allow set of approval to zero address", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			const result = token.approve(ADDRESS_ZERO, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve to zero address.");
		});
	}

	Approve_ShouldEmitApprovalEvent(): Mocha.Test
	{
		return it("approve: Should emit `Approval` event", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			// Act
			const result = await token.approve(bob.address, 10);
			// Assert
			await expect(result).to.emit(token, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
		});
	}

	Approve_ShouldAllowSetOfApproval(): Mocha.Test
	{
		return it("approve: Should allow set of approval", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);
			// Act
			const result = await token.approve(bob.address, 10);
			// Assert
			const approved = await token.allowance(alice.address, bob.address);
			expect(approved).to.equal(BigNumber.from(10));
			await expect(result).to.emit(token, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
		});
	}

	Approve_ProofOfUnfixableApproveAttackVector(): Mocha.Test
	{
		return it("approve: Proof of unfixable approve/transferFrom attack vector", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(this._deployFixture);

			await token.approve(bob.address, 0);
			const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(50).sub(30);
			const expectedBalanceBob = (await token.balanceOf(bob.address)).add(50).add(30);
			// Act
			await token.approve(bob.address, 50);
			await StopAutomine();
			// What happens is that Alice is changing the approved tokens from 50 to 30.
			// Bob notice this before the Transaction of Alice is confirmed and added his on transferFrom transaction.
			// The attack is successfull if the transferFrom transaction is confirmed before the approve transaction or
			// if confirmed in the same block the transferFrom transaction is processed first.
			// We simulate that second case.
			await token.connect(bob).transferFrom(alice.address, bob.address, 50);
			await token.approve(bob.address, 30);
			await AdvanceBlock();
			// The Damange is now done. There is no way to prevent this inside the approve method.
			await StartAutomine();
			await token.connect(bob).transferFrom(alice.address, bob.address, 30);
			// Assert
			expect(await token.balanceOf(alice.address)).to.equal(expectedBalanceAlice);
			expect(await token.balanceOf(bob.address)).to.equal(expectedBalanceBob);
		});
	}

	Transfer_ShouldEmitTransferEvent(): Mocha.Test
	{
		return it("transfer: Should emit `Transfer` event", async () =>
		{
			// Arrange
			const { token, alice, carol } = await loadFixture(this._deployFixture);
			// Act
			const result = await token.transfer(carol.address, 10);
			// Assert
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Transfer(address,address,uint256)");
		});
	}

	Transfer_ShouldAllowTokenTransfer(): Mocha.Test
	{
		return it("transfer: Should allow token transfer", async () =>
		{
			// Arrange
			const { token, alice, carol } = await loadFixture(this._deployFixture);

			const expectedTotalSupply = await token.totalSupply();
			const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(10);
			const expectedBalanceCarol = BigNumber.from(0).add(10);
			// Act
			const result = await token.transfer(carol.address, 10);
			// Assert
			const totalSupply = await token.totalSupply();
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			expect(totalSupply).to.equal(expectedTotalSupply);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			await EmitOnlyThis(result, token, "Transfer(address,address,uint256)");
		});
	}

	Transfer_ShouldNotAllowTransferFromZeroAddress(): Mocha.Test
	{
		return it("transfer: Should not allow transfer from zero address", async () =>
		{
			// Arrange
			const { token, alice } = await loadFixture(this._deployFixture);

			const signerZero = await ethers.getImpersonatedSigner(ADDRESS_ZERO); // Fund the zero address to pay for the transaction
			await alice.sendTransaction({ to: signerZero.address, value: ethers.utils.parseEther("1") }); // Send 1 ETH;

			// Act
			const result = token.connect(signerZero).transfer(alice.address, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer from zero address.");
		});
	}

	Transfer_ShouldNotAllowTransferToZeroAddress(): Mocha.Test
	{
		return it("transfer: Should not allow transfer to zero address", async () =>
		{
			// Arrange
			const { token } = await loadFixture(this._deployFixture);
			// Act
			const result = token.transfer(ADDRESS_ZERO, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer to zero address.");

		});
	}

	Transfer_ShouldNotAllowTransferMoreThanBalance(): Mocha.Test
	{
		return it("transfer: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			const { token, alice, carol } = await loadFixture(this._deployFixture);

			const balanceAlice = (await token.balanceOf(alice.address));
			const balanceCarol = (await token.balanceOf(carol.address));
			const toTransfer = balanceAlice.add(10);
			// Act
			const result = token.transfer(carol.address, toTransfer);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "AmountExceedsBalance").withArgs(alice.address, balanceAlice, toTransfer);
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			expect(aliceBal).to.equal(balanceAlice);
			expect(carolBal).to.equal(balanceCarol);
		});
	}

	TransferFrom_ShouldEmitTransferAndApprovalEvent(): Mocha.Test
	{
		return it("transferFrom: Should emit `Transfer` and `Approval` event", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			await token.approve(bob.address, 50);
			// Act
			const result = await token.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			await expect(result).to.emit(token, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
		});
	}

	TransferFrom_ShouldAllowTokenTransferAndReduceAllowance(): Mocha.Test
	{
		return it("transferFrom: Should allow token transfer and reduce allowance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(10);
			const expectedBalanceCarol = (await token.balanceOf(carol.address)).add(10);
			const expectedTotalSupply = (await token.totalSupply());
			await token.approve(bob.address, 50);
			// Act
			const result = await token.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			const totalSupply = await token.totalSupply();
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			const allowance = await token.allowance(alice.address, bob.address);
			expect(totalSupply).to.equal(expectedTotalSupply);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(BigNumber.from(40));
			await expect(result).to.emit(token, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
		});
	}

	TransferFrom_ShouldAllowTokenTransferAndNotReduceInfiniteAllowance(): Mocha.Test
	{
		return it("transferFrom: Should allow token transfer and not reduce infinite allowance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			const max: BigNumber = UINT256_MAX;
			const expectedBalanceAlice = (await token.balanceOf(alice.address)).sub(10);
			const expectedBalanceCarol = (await token.balanceOf(carol.address)).add(10);
			const expectedTotalSupply = (await token.totalSupply());
			await token.approve(bob.address, max);
			// Act
			const result = await token.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			const totalSupply = await token.totalSupply();
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			const allowance = await token.allowance(alice.address, bob.address);
			expect(totalSupply).to.equal(expectedTotalSupply);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(max);
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Transfer(address,address,uint256)");
		});
	}

	TransferFrom_ShouldNotAllowTransferMoreThanBalance(): Mocha.Test
	{
		return it("transferFrom: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			const expectedBalanceAlice = await token.balanceOf(alice.address);
			const expectedBalanceCarol = await token.balanceOf(carol.address);
			const expectedAllowance = expectedBalanceAlice.add(200);
			await token.approve(bob.address, expectedAllowance);
			const toTransfer = expectedBalanceAlice.add(10);
			// Act
			const result = token.connect(bob).transferFrom(alice.address, carol.address, toTransfer);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "AmountExceedsBalance").withArgs(alice.address, expectedBalanceAlice, toTransfer);
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			const allowance = await token.allowance(alice.address, bob.address);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(expectedAllowance);
		});
	}

	TransferFrom_ShouldNotAllowTransferMoreThanAllowance(): Mocha.Test
	{
		return it("transferFrom: Should not allow transfer more than allowance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(this._deployFixture);

			const expectedBalanceAlice = await token.balanceOf(alice.address);
			const expectedBalanceCarol = await token.balanceOf(carol.address);
			await token.approve(bob.address, 90);
			// Act
			const result = token.connect(bob).transferFrom(alice.address, carol.address, 100);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InsufficientAllowance").withArgs(90, 100);
			const aliceBal = await token.balanceOf(alice.address);
			const carolBal = await token.balanceOf(carol.address);
			const allowance = await token.allowance(alice.address, bob.address);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(BigNumber.from(90));
		});
	}
}