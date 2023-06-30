import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ADDRESS_ZERO, AdvanceBlock, EmitOnlyThis, StartAutomine, StopAutomine, UINT256_MAX } from "../../helpers";
import { BigNumber } from "ethers";
import { IERC20Mock } from "../../../typechain-types";
import { IERC20MetadataTests, testIERC20Metadata } from "./IERC20Metadata.shared";

describe("ERC20", async () =>
{
	async function deployERC20MockFixture(): Promise<{ token: IERC20Mock, alice: SignerWithAddress, bob: SignerWithAddress, carol: SignerWithAddress }>
	{
		const signers = await ethers.getSigners();
		const alice = signers[0];
		const bob = signers[1];
		const carol = signers[2];


		const erc20Factory = await ethers.getContractFactory("ERC20Mock");
		const token = await erc20Factory.deploy("Name", "SYM");

		return { token, alice, bob, carol };
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
			const { token, alice } = await loadFixture(deployERC20MockFixture);
			const signerZero = await ethers.getImpersonatedSigner(ADDRESS_ZERO); // Fund the zero address to pay for the transaction
			await alice.sendTransaction({ to: signerZero.address, value: ethers.utils.parseEther("1") }); // Send 1 ETH;
			// Act
			const result = token.connect(signerZero).approve(alice.address, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve from zero address.");
		});

		it("ERC20.approve: Should not allow set of approval to zero address", async () =>
		{
			// Arrange
			const { token } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = token.approve(ADDRESS_ZERO, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not approve to zero address.");
		});

		it("ERC20.approve: Should emit `Approval` event", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = await token.approve(bob.address, 10);
			// Assert
			await expect(result).to.emit(token, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
		});

		it("ERC20.approve: Should allow set of approval", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(deployERC20MockFixture);
			// Act
			const result = await token.approve(bob.address, 10);
			// Assert
			const approved = await token.allowance(alice.address, bob.address);
			expect(approved).to.equal(BigNumber.from(10));
			await expect(result).to.emit(token, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 10);
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
		});

		it("ERC20.approve: Proof of unfixable approve/transferFrom attack vector", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(deployERC20MockFixture);
			await token.mockBurn(alice.address, await token.balanceOf(alice.address));
			await token.approve(bob.address, 0);
			await token.mockMint(alice.address, 100);
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

		it("ERC20.transfer: Should emit `Transfer` event", async () =>
		{
			// Arrange
			const { token, alice, carol } = await loadFixture(deployERC20MockFixture);
			await token.mockMint(alice.address, 100);
			// Act
			const result = await token.transfer(carol.address, 10);
			// Assert
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Transfer(address,address,uint256)");
		});

		it("ERC20.transfer: Should allow token transfer", async () =>
		{
			// Arrange
			const { token, alice, carol } = await loadFixture(deployERC20MockFixture);
			await token.mockMint(alice.address, 100);
			const expectedBalanceAlice = BigNumber.from(100).sub(10);
			const expectedBalanceCarol = BigNumber.from(0).add(10);
			const expectedTotalSupply = BigNumber.from(100);
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

		it("ERC20.transfer: Should not allow transfer from zero address", async () =>
		{
			// Arrange
			const { token, alice } = await loadFixture(deployERC20MockFixture);
			const signerZero = await ethers.getImpersonatedSigner(ADDRESS_ZERO); // Fund the zero address to pay for the transaction
			await alice.sendTransaction({ to: signerZero.address, value: ethers.utils.parseEther("1") }); // Send 1 ETH;
			await token.mockMint(alice.address, 100);
			// Act
			const result = token.connect(signerZero).transfer(alice.address, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer from zero address.");
		});

		it("ERC20.transfer: Should not allow transfer to zero address", async () =>
		{
			// Arrange
			const { token, alice } = await loadFixture(deployERC20MockFixture);
			await token.mockMint(alice.address, 100);
			// Act
			const result = token.transfer(ADDRESS_ZERO, 10);
			// Assert
			await expect(result).to.be.revertedWithCustomError(token, "InvalidAddress").withArgs(ADDRESS_ZERO, "Can not transfer to zero address.");

		});

		it("ERC20.transfer: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			const { token, alice, carol } = await loadFixture(deployERC20MockFixture);
			await token.mockMint(alice.address, 100);
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

		it("ERC20.transferFrom: Should emit `Transfer` and `Approval` event", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await token.mockMint(alice.address, 100);
			await token.approve(bob.address, 50);
			// Act
			const result = await token.connect(bob).transferFrom(alice.address, carol.address, 10);
			// Assert
			await expect(result).to.emit(token, "Approval(address,address,uint256)").withArgs(alice.address, bob.address, 40);
			await expect(result).to.emit(token, "Transfer(address,address,uint256)").withArgs(alice.address, carol.address, 10);
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)", "Transfer(address,address,uint256)");
		});

		it("ERC20.transferFrom: Should allow token transfer and reduce allowance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await token.mockMint(alice.address, 100);
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

		it("ERC20.transferFrom: Should allow token transfer and not reduce infinite allowance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			const max: BigNumber = UINT256_MAX;
			await token.mockMint(alice.address, 100);
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

		it("ERC20.transferFrom: Should not allow transfer more than balance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await token.mockMint(alice.address, 100);
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

		it("ERC20.transferFrom: Should not allow transfer more than allowance", async () =>
		{
			// Arrange
			const { token, alice, bob, carol } = await loadFixture(deployERC20MockFixture);
			await token.mockMint(alice.address, 100);
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
	});

	context("IERC20AltApprove", () =>
	{
		it("ERC20.decreaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(deployERC20MockFixture);
			await token.increaseAllowance(bob.address, 100);
			const expectedAllowance = BigNumber.from(50);
			// Act
			const result = await token.decreaseAllowance(bob.address, 50);
			// Assert
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
			expect(await token.allowance(alice.address, bob.address)).to.be.equal(expectedAllowance);
		});

		it("ERC20.decreaseAllowance: Should allow token holder to change allowance multible times", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(deployERC20MockFixture);
			await token.increaseAllowance(bob.address, 100);
			const expectedAllowance = BigNumber.from(20);
			// Act
			await token.decreaseAllowance(bob.address, 50);
			await token.decreaseAllowance(bob.address, 10);
			await token.decreaseAllowance(bob.address, 20);
			// Assert
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});

		it("ERC20.decreaseAllowance: Should not allow token holder to change allowance below 0", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(deployERC20MockFixture);
			await token.increaseAllowance(bob.address, 100);
			const allowance = await token.allowance(alice.address, bob.address);
			const expectedAllowance = BigNumber.from(100);
			// Act
			const result = token.decreaseAllowance(bob.address, allowance.add(1));
			// Assert
			await expect(result).to.revertedWithCustomError(token, "AllowanceBelowZero").withArgs(100, 101);
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});

		it("ERC20.increaseAllowance: Should allow token holder to change allowance", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(deployERC20MockFixture);
			const expectedAllowance = BigNumber.from(50);
			// Act
			const result = await token.increaseAllowance(bob.address, 50);
			// Assert
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});

		it("ERC20.increaseAllowance: Should allow token holder to change allowance above hold tokens", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(deployERC20MockFixture);
			await token.mockBurn(alice.address, await token.balanceOf(alice.address));
			await token.mockMint(alice.address, 100);
			await token.approve(bob.address, 0);
			const expectedAllowance = BigNumber.from(200);
			// Act
			const result = await token.increaseAllowance(bob.address, expectedAllowance);
			// Assert
			await EmitOnlyThis(result, token, "Approval(address,address,uint256)");
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});

		it("ERC20.increaseAllowance: Should allow token holder to change allowance multible times", async () =>
		{
			// Arrange
			const { token, alice, bob } = await loadFixture(deployERC20MockFixture);
			await token.mockBurn(alice.address, await token.balanceOf(alice.address));
			await token.approve(bob.address, 0);
			await token.mockMint(alice.address, 100);
			const expectedAllowance = BigNumber.from(80);
			// Act
			await token.increaseAllowance(bob.address, 50);
			await token.increaseAllowance(bob.address, 10);
			await token.increaseAllowance(bob.address, 20);
			// Assert
			expect(await token.allowance(alice.address, bob.address)).to.equal(expectedAllowance);
		});
	});

	testIERC20Metadata(new IERC20MetadataTests(deployERC20MockFixture, "Name", "SYM", 18));
});


