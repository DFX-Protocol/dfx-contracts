import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ADDRESS_ZERO, AdvanceBlock, EmitOnlyThis, StartAutomine, StopAutomine, UINT256_MAX } from "../../helpers";
import { BigNumber } from "ethers";
import { IERC20Mock } from "../../../typechain-types";

describe("ERC20", async () =>
{
	async function deployERC20MockFixture(): Promise<{ erc20: IERC20Mock, alice: SignerWithAddress, bob: SignerWithAddress, carol: SignerWithAddress }>
	{
		const signers = await ethers.getSigners();
		const alice = signers[0];
		const bob = signers[1];
		const carol = signers[2];


		const erc20Factory = await ethers.getContractFactory("ERC20Mock");
		const erc20 = await erc20Factory.deploy("Name", "SYM");

		return { erc20, alice, bob, carol };
	}

	context("IERC20", async () =>
	{
		it("ERC20.constructor: Should emit nothing", async () =>
		{
			// NOTICE: We use the original ERC20 to prevent testing an modified constructor.
			// Arrange
			const factory = await ethers.getContractFactory("ERC20");
			const originalERC20 = await factory.deploy("Original", "OOO");
			await originalERC20.deployed();
			// Act
			const result = originalERC20.deployTransaction;
			// Assert
			await EmitOnlyThis(result, originalERC20);
		});

		it("ERC20.approve: Should not allow set of approval from zero address", async () =>
		{
			// Arrange
			const { erc20, alice } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = erc20.mockApproveFromZeroAddress(alice.address, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve from zero address.");
		});

		it("ERC20.approve: Should not allow set of approval to zero address", async () =>
		{
			// Arrange
			const { erc20 } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = erc20.approve(ADDRESS_ZERO, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve to zero address.");
		});

		it("ERC20.approve: Should emit `Approval` event", async () =>
		{
			// Arrange
			const { erc20, alice, bob } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = await erc20.approve(bob.address, 10);
			// Assert
			await expect(result).to.emit(erc20, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
			await EmitOnlyThis(result, erc20, "Approval(address,address,uint256)");
		});

		it("ERC20.approve: Should allow set of approval", async () =>
		{
			// Arrange
			const { erc20, alice, bob } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = await erc20.approve(bob.address, 10);
			// Assert
			const approved = await erc20.allowance(alice.address, bob.address);
			expect(approved).to.equal(BigNumber.from(10));
			await expect(result).to.emit(erc20, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
			await EmitOnlyThis(result, erc20, "Approval(address,address,uint256)");
		});

		it("ERC20.approve: Proof of unfixable approve/transferFrom attack vector", async () =>
		{
			// Arrange
			const { erc20, alice, bob } = await loadFixture(deployERC20MockFixture);
			await erc20.mockBurn(alice.address, await erc20.balanceOf(alice.address));
			await erc20.approve(bob.address, 0);
			await erc20.mockMint(alice.address, 100);
			const expectedBalanceAlice = (await erc20.balanceOf(alice.address)).sub(50).sub(30);
			const expectedBalanceBob = (await erc20.balanceOf(bob.address)).add(50).add(30);
			// Act
			await erc20.approve(bob.address, 50);
			await StopAutomine();
			// What happens is that Alice is changing the approved tokens from 50 to 30.
			// Bob notice this before the Transaction of Alice is confirmed and added his on transferFrom transaction.
			// The attack is successfull if the transferFrom transaction is confirmed before the approve transaction or
			// if confirmed in the same block the transferFrom transaction is processed first.
			// We simulate that second case.
			await erc20.connect(bob).transferFrom(alice.address, bob.address, 50);
			await erc20.approve(bob.address, 30);
			await AdvanceBlock();
			// The Damange is now done. There is no way to prevent this inside the approve method.
			await StartAutomine();
			await erc20.connect(bob).transferFrom(alice.address, bob.address, 30);
			// Assert
			expect(await erc20.balanceOf(alice.address)).to.equal(expectedBalanceAlice);
			expect(await erc20.balanceOf(bob.address)).to.equal(expectedBalanceBob);
		});

		it("ERC20.transfer: Should emit `Transfer` event", async () =>
		{
			// Arrange
			const { erc20, alice, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			// Act
			const result = await erc20.transfer(carol.address, 10);
			// Assert
			await expect(result).to.emit(erc20, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, erc20, "Transfer(address,address,uint256)");
		});

		it("ERC20.transfer: Should allow token transfer", async () =>
		{
			// Arrange
			const { erc20, alice, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			const expectedBalanceAlice = BigNumber.from(100).sub(10);
			const expectedBalanceCarol = BigNumber.from(0).add(10);
			const expectedTotalSupply = BigNumber.from(100);
			// Act
			const result = await erc20.transfer(carol.address, 10);
			// Assert
			const totalSupply = await erc20.totalSupply();
			const aliceBal = await erc20.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			expect(totalSupply).to.equal(expectedTotalSupply);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			await EmitOnlyThis(result, erc20, "Transfer(address,address,uint256)");
		});

		it("ERC20.transfer: Should not allow transfer from zero address", async () =>
		{
			// Arrange
			const { erc20, alice } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			// Act
			const result = erc20.mockTransferFromZeroAddress(alice.address, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer from zero address.");
		});

		it("ERC20.transfer: Should not allow transfer to zero address", async () =>
		{
			// Arrange
			const { erc20, alice } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			// Act
			const result = erc20.transfer(ADDRESS_ZERO, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer to zero address.");

		});

		it("ERC20.transfer: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			const { erc20, alice, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			const balanceAlice = (await erc20.balanceOf(alice.address));
			const balanceCarol = (await erc20.balanceOf(carol.address));
			const toTransfer = balanceAlice.add(10);
			// Act
			const result = erc20.transfer(carol.address, toTransfer);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "AmountExceedsBalance").withArgs(alice.address, balanceAlice, toTransfer);
			const aliceBal = await erc20.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			expect(aliceBal).to.equal(balanceAlice);
			expect(carolBal).to.equal(balanceCarol);
		});

		it("ERC20.transferFrom: Should emit `Transfer` and `Approval` event", async () =>
		{
			// Arrange
			const { erc20, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			await erc20.approve(bob.address, 50);
			// Act
			const result = await erc20.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			await expect(result).to.emit(erc20, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
			await expect(result).to.emit(erc20, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, erc20, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
		});

		it("ERC20.transferFrom: Should allow token transfer and reduce allowance", async () =>
		{
			// Arrange
			const { erc20, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			const expectedBalanceAlice = (await erc20.balanceOf(alice.address)).sub(10);
			const expectedBalanceCarol = (await erc20.balanceOf(carol.address)).add(10);
			const expectedTotalSupply = (await erc20.totalSupply());
			await erc20.approve(bob.address, 50);
			// Act
			const result = await erc20.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			const totalSupply = await erc20.totalSupply();
			const aliceBal = await erc20.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			const allowance = await erc20.allowance(alice.address, bob.address);
			expect(totalSupply).to.equal(expectedTotalSupply);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(BigNumber.from(40));
			await expect(result).to.emit(erc20, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
			await expect(result).to.emit(erc20, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, erc20, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
		});

		it("ERC20.transferFrom: Should allow token transfer and not reduce infinite allowance", async () =>
		{
			// Arrange
			const { erc20, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			const max: BigNumber = UINT256_MAX;
			await erc20.mockMint(alice.address, 100);
			const expectedBalanceAlice = (await erc20.balanceOf(alice.address)).sub(10);
			const expectedBalanceCarol = (await erc20.balanceOf(carol.address)).add(10);
			const expectedTotalSupply = (await erc20.totalSupply());
			await erc20.approve(bob.address, max);
			// Act
			const result = await erc20.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			const totalSupply = await erc20.totalSupply();
			const aliceBal = await erc20.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			const allowance = await erc20.allowance(alice.address, bob.address);
			expect(totalSupply).to.equal(expectedTotalSupply);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(max);
			await expect(result).to.emit(erc20, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, erc20, "Transfer(address,address,uint256)");
		});

		it("ERC20.transferFrom: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			const { erc20, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			const expectedBalanceAlice = await erc20.balanceOf(alice.address);
			const expectedBalanceCarol = await erc20.balanceOf(carol.address);
			const expectedAllowance = expectedBalanceAlice.add(200);
			await erc20.approve(bob.address, expectedAllowance);
			const toTransfer = expectedBalanceAlice.add(10);
			// Act
			const result = erc20.connect(bob).transferFrom(alice.address, carol.address, toTransfer);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "AmountExceedsBalance").withArgs(alice.address, expectedBalanceAlice, toTransfer);
			const aliceBal = await erc20.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			const allowance = await erc20.allowance(alice.address, bob.address);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(expectedAllowance);
		});

		it("ERC20.transferFrom: Should not allow transfer more than allowance", async () =>
		{
			// Arrange
			const { erc20, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await erc20.mockMint(alice.address, 100);
			const expectedBalanceAlice = await erc20.balanceOf(alice.address);
			const expectedBalanceCarol = await erc20.balanceOf(carol.address);
			await erc20.approve(bob.address, 90);
			// Act
			const result = erc20.connect(bob).transferFrom(alice.address, carol.address, 100);
			// Assert
			await expect(result).to.be.revertedWithCustomError(erc20, "InsufficientAllowance").withArgs(90, 100);
			const aliceBal = await erc20.balanceOf(alice.address);
			const carolBal = await erc20.balanceOf(carol.address);
			const allowance = await erc20.allowance(alice.address, bob.address);
			expect(aliceBal).to.equal(expectedBalanceAlice);
			expect(carolBal).to.equal(expectedBalanceCarol);
			expect(allowance).to.equal(BigNumber.from(90));
		});
	});

	describe("IERC20AltApprove", () =>
	{
		it("ERC20.decreaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			const { erc20, alice, bob } = await loadFixture(deployERC20MockFixture);
			await erc20.increaseAllowance(bob.address, 100);
			const expectedAllowance = BigNumber.from(50);
			// Act
			const result = await erc20.decreaseAllowance(bob.address, 50);
			// Assert
			await EmitOnlyThis(result, erc20, "Approval(address,address,uint256)");
			expect(await erc20.allowance(alice.address, bob.address)).to.be.equal(expectedAllowance);
		});

		it("ERC20.decreaseAllowance: Should allow token holder to change allowance multible times", async () =>
		{
			// Arrange
			const { erc20, alice, bob } = await loadFixture(deployERC20MockFixture);
			await erc20.increaseAllowance(bob.address, 100);
			const expectedAllowance = BigNumber.from(20);
			// Act
			await erc20.decreaseAllowance(bob.address, 50);
			await erc20.decreaseAllowance(bob.address, 10);
			await erc20.decreaseAllowance(bob.address, 20);
			// Assert
			expect(await erc20.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});

		it("ERC20.decreaseAllowance: Should not allow token holder to change allowance below 0", async () =>
		{
			// Arrange
			const { erc20, alice, bob } = await loadFixture(deployERC20MockFixture);
			await erc20.increaseAllowance(bob.address, 100);
			const allowance = await erc20.allowance(alice.address, bob.address);
			const expectedAllowance = BigNumber.from(100);
			// Act
			const result = erc20.decreaseAllowance(bob.address, allowance.add(1));
			// Assert
			await expect(result).to.revertedWithCustomError(erc20, "AllowanceBelowZero").withArgs(100, 101);
			expect(await erc20.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});

		it("ERC20.increaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			const { erc20, alice, bob } = await loadFixture(deployERC20MockFixture);
			const expectedAllowance = BigNumber.from(50);
			// Act
			const result = await erc20.increaseAllowance(bob.address, 50);
			// Assert
			await EmitOnlyThis(result, erc20, "Approval(address,address,uint256)");
			expect(await erc20.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});

		it("ERC20.increaseAllowance: Should allow token holder to change allowance above hold tokens", async () =>
		{
			// Arrange
			const { erc20, alice, bob } = await loadFixture(deployERC20MockFixture);
			await erc20.mockBurn(alice.address, await erc20.balanceOf(alice.address));
			await erc20.mockMint(alice.address, 100);
			await erc20.approve(bob.address, 0);
			const expectedAllowance = BigNumber.from(200);
			// Act
			const result = await erc20.increaseAllowance(bob.address, expectedAllowance);
			// Assert
			await EmitOnlyThis(result, erc20, "Approval(address,address,uint256)");
			expect(await erc20.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});

		it("ERC20.increaseAllowance: Should allow token holder to change allowance multible times", async () =>
		{
			// Arrange
			const { erc20, alice, bob } = await loadFixture(deployERC20MockFixture);
			await erc20.mockBurn(alice.address, await erc20.balanceOf(alice.address));
			await erc20.approve(bob.address, 0);
			await erc20.mockMint(alice.address, 100);
			const expectedAllowance = BigNumber.from(80);
			// Act
			await erc20.increaseAllowance(bob.address, 50);
			await erc20.increaseAllowance(bob.address, 10);
			await erc20.increaseAllowance(bob.address, 20);
			// Assert
			expect(await erc20.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	});

	describe("IERC20Metadata", async () =>
	{
		it("ERC20.decimals: Should return correct decimals", async () =>
		{
			// Arrange
			const { erc20 } = await loadFixture(deployERC20MockFixture);
			// Act
			const decimals: number = await erc20.decimals();
			// Assert
			expect(decimals).to.equal(18);
		});

		it("ERC20.name: Should return correct name", async () =>
		{
			// Arrange
			const { erc20 } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = await erc20.name();
			// Assert
			expect(result).to.equal("Name");
		});

		it("ERC20.symbol: Should return correct symbol", async () =>
		{
			// Arrange
			const { erc20 } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = await erc20.symbol();
			// Assert
			expect(result).to.equal("SYM");
		});
	});
});